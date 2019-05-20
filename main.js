/*

  Project: njsll
  Version: 1.0
  Author: OpperDev
  Twitter: @OpperDev
  License: MIT
  GitHub: https://github/OpperDev/njsll

*/

'use strict'

const {remote} = require('electron'),
      request = require('request'),
      is = require('electron-is'),
      child_process = require('child_process'),
      glob = require('glob'),
      fs = require('fs'),
      fs_extra = require('fs-extra'),
      extract = require('extract-zip'),
      dialog = remote.dialog

module.exports =  {

  /* =================================== */
  /*    Update/Download/Extract          */
  /* =================================== */

  downloadFile: async function(options, progress) {
    return new Promise((resolve, reject) => {
      let received_bytes = 0
      let total_bytes = 0
      let req = request({
        method: 'GET',
        uri: options.url
      })
      let out = fs.createWriteStream(options.target)
      req.pipe(out)
      req.on('response', data => {
        total_bytes = parseInt(data.headers['content-length'])
      })
      req.on('data', chunk => {
        received_bytes += chunk.length
        progress(received_bytes, total_bytes)
      })
      req.on('end', () => resolve())
    })
  },

  extractFile: async function(input, output) {
    return new Promise((resolve, reject) => {
      extract(input, {
        dir: output
      }, err => {
        if (err) reject(err)
        else resolve()
      })
    })
  },

  downloadExtract: async function(options, progress, finished) {
    if (fs.existsSync(options.path)) fs_extra.removeSync(options.path)
    downloadFile(options, (rb, tb) => progress(rb, tb))
      .then(() => extractFile(options.target, options.path)
        .then(() => finished())
        .catch(err => console.log('Error', err)))
  },

  update: async function(options, progress, finished) {
    if (!fs.existsSync(options.path) || !fs.existsSync(options.path + '/vrs.id')) {
      downloadExtract(options, progress, finished)
      return
    }
    fs.access(options.path + '/vrs.id', fs.F_OK, err => {
      if (err) consle.log('Error', err)
      else {
        request.get(options.versionURL, (error, response, body) => {
          if (error || response.statusCode !== 200) console.log('Error', error)
          else {
            fs.readFile(options.path + '/vrs.id', 'utf8', (e, d) => {
              if (e) console.log('Error', e)
              else {
                if (body !== d) downloadExtract(options, progress, finished)
                else finished()
              }
            })
          }
        })
      }
    })
  },

  /* =================================== */
  /*    Authentification                 */
  /* =================================== */

  makeRequest: async function(options, callback) {
    if (options.type === 'get') request.get(options.url, callback)
    else if (options.type === 'post') request.post({url: options.url, form: options.credentials}, callback)
  },

  auth: async function(options, valid, callback) {
    if (options.type === 'post' || options.type === 'get') {
      makeRequest(options, credentials, (error, response, body) => {
        if (error || response.statusCode !== 200) callback('error', 'Unexpected error was catched')
        else {
          if (!valid(body, options.success)) {
            for (let i = 0; i < options.errors.length; i++) {
              if (valid(body, options.errors[i].error)) {
                callback('error', options.errors[i].message)
                break
              }
            }
           } else callback('info', 'Success!')
        }
      })
    } else callback('error', 'Only get & post methods are accepted')
  },

  /* =================================== */
  /*    Execution                        */
  /* =================================== */

  exec: function(command, callback) {
    child_process.exec(command, callback)
  },

  launchGame: async function(src, options, callback) {
    getDirectory(src + '/libraries', 'jar', (err, res) => {
      if (err) console.log('Error', err)
      else {
        let command = options.customCommand ? options.customCommand : apsep([
          getJavaCommand(),
          '-XX:-UseAdaptiveSizePolicy',
          '-XX:+UseConcMarkSweepGC',
          '-Djava.library.path=' + src + '/natives',
          '-Dfml.ignoreInvalidMinecraftCertificates=true',
          '-Dfml.ignorePatchDiscrepancies=true',
          options.ram,
          '-cp',
          apsep(res, ';') + ';' + src + '/minecraft.jar',
          options.mainClass,
          '--username=' + options.username,
          '--accessToken', 'nothing',
          '--version', options.version,
          '--gameDir', src,
          '--assetsDir', src + '/assets',
          '--assetIndex', options.version,
          '--userProperties', '{}',
          '--uuid', 'nothing',
          '--userType', 'legacy'
        ], ' ');
        exec(command, callback)
      }
    })
  },

  /* =================================== */
  /*    Utilities                        */
  /* =================================== */

  isJavaInstalled: function(callback) {
    exec(getJavaCommand() + ' -version', (error, stdout, stderr) => {
      if (error !== null) callback(error, stdout, stderr)
    })
  },

  getJavaCommand: function() {
    let javaCmd = process.env.JAVA_HOME + '/bin/java'
    return '"' + javaCmd + '"'
  },

  getOS: function() {
    if (is.windows()) return "win"
    if (is.macOS()) return "darwin"
    if (is.linux()) return "linux"
    return "/"
  },

  getDirectory: function(src, ext, callback) {
    glob(src + (ext != null ? '/**/*.' + ext : '/**/*'), callback)
  },

  apsep: function apsep(array, sep) {
    return array.join(sep)
  },

  messageBox: function(type, buttons, title, message, callback) {
    dialog.showMessageBox(remote.getCurrentWindow(), {
      type: type,
      buttons: buttons,
      title: title,
      message: message
    }, callback)
  }

}
