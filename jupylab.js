const {app, BrowserWindow} = require('electron')
const os = require('os')
const request = require('request')
const { spawn } = require('child_process')

const generateKey = (length) => {
    s = ''
    for (i=0; i<length;i++){
        s += Math.floor(Math.random()*10).toString()
    }
    return s  
}

let window
let token = generateKey(20)
function createWindow () {
    // Erstellen des Browser-Fensters.
    window = new BrowserWindow({width: 1280, height: 780, icon: 'logo.png'})

    window.setMenu(null)
    window.loadFile('index.html')
    let loaded = false
    const interval = setInterval(() => {
        request(`http://localhost:8888/lab`, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                clearInterval(interval)
                if (!loaded){
                    console.log("jupyterlab is READY") 
                    window.loadURL(`http://localhost:8888/lab?token=${token}`)
                    loaded = true
                }
            }
        })
    }, 200)
    

    window.on('close', () => {
        console.log('Closing...')
        if (process.platform !== 'darwin') {
            app.quit()
        }
    })


    // Ausgegeben, wenn das Fenster geschlossen wird.
    window.on('closed', () => {
        window = null
    })
}

app.on('ready', () =>{
    spawn('jupyter', ['lab', '--no-browser', `--NotebookApp.token='${token}'`,`--NotebookApp.notebook_dir=${os.homedir()}`] )
    createWindow()
})


app.on('before-quit', () => {
    window.removeAllListeners('close')
    console.log(`Attempting to kill jupyterlab in ${process.platform}`)
    if (process.platform == 'win32') {
        spawn("taskkill", ['/F', '/IM', 'jupyter-lab.exe'], {detached: true})
    }
    if (process.platform == 'linux') {
        spawn("killall", ['jupyter-lab'], {detached: true})
    }

    setTimeout(() => {
        if (process.platform == 'win32') {
            spawn("taskkill", ['/F', '/IM', 'electron.exe'], {detached: true})
        }
        if (process.platform == 'linux') {
            spawn("killall", ['electron'], {detached: true})
        }
    }, 1000)
})

app.on('will-quit', () => {
    console.log('quittig')
})
// Verlassen, wenn alle Fenster geschlossen sind.
app.on('window-all-closed', () => {
// Unter macOS ist es üblich für Apps und ihre Menu Bar
// aktiv zu bleiben bis der Nutzer explizit mit Cmd + Q die App beendet.
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
// Unter macOS ist es üblich ein neues Fenster der App zu erstellen, wenn
// das Dock Icon angeklickt wird und keine anderen Fenster offen sind.
    if (window === null) {
        createWindow()
    }
})
