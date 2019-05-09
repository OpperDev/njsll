
# Minecraft nodejs launcher library
I've developed a nodejs library allowing you to develop minecraft launchers with electron or any framework that uses nodejs, moreover, everything is very simple.

## How to install it?
You just need to create your nodejs project, and type following command:
`npm install @opperdev/njsll --save`

## How to use it?
In first time, declare a variable named "njsll" in your file, like this:
`const njsll = require('njsll)`
You will then have access to the methods.

## Available methods
 - downloadFile(options, progress) > for downloading a file
 - extractFile(input, output) > for extracting a zip file
 - downloadExtract(options, progress, finished) > for downloading and extracting a zip file
 - update(options, progress, finished) > for checking for updates
 - makeRequest(options, callback) > for building a request get/post
 - auth(options, valid, callback) > for authentification
 - exec(command, callback) > for executing a command line
 - launchGame(src, options, callback) > for launching the game
 - isJavaInstalled(callback) > for checking if java is installed on the machine
 - getJavacommand() > for getting the java command
 - getOS() > for getting the os of the machine (win/darwin/linux)
 - getDirectory(src, ext, callback) > for recursively getting a directory, and process on it within a callback
 - apsep(array, sep) > for join an array with a separating char
 - messageBox(type, buttons, title, message, callback) > for sending a message box to the user, and process on the response within a callback

## Checking if java is installed
If java is not installed on the machine, you gonna have some difficulties to launch minecraft, that's why I've create a method that tell you if java is installed, or not:
```javascript
isJavaInstalled((error, stdout, stderr) => {
  messageBox('error', ['Close'], 'Launcher', 'Java is not installed', (response, checked) => ipc.send('close-app'))
})
```
In this case, I check if java is installed, and if not, I send a message box to inform the user of that, and I close the application.

## Authentification
This is how the "auth" method works:
`auth(options, valid, callback)`
##### Parameters:
 - options: That parameter contains all the request informations, if is it a post or get request, the url, the possibles error messages, the success message, and for post requests, I would contains the form credentials of the user, here an exemple:
```javascript
var username = [...]
var password = [...]

var authGetOptions = {
  type: 'get',
  success: 'OK',
  errors: [
    { error: 'E0', message: 'Please fill all required fields' },
    { error: 'IA0', message: 'Unexpected error was catched' },
    { error: 'CNCDB0', message: 'Unexpected error was catched' },
    { error: 'NF0', message: 'This user doesn\'t exists' },
    { error: 'IP0', message: 'Incorrect password' }
  ]
}

var authPostOptions = {
  type: 'post',
  success: 'OK',
  credentials: {
    username: username,
    password: password
  },
  errors: [
    { error: 'E0', message: 'Please fill all required fields' },
    { error: 'IA0', message: 'Unexpected error was catched' },
    { error: 'CNCDB0', message: 'Unexpected error was catched' },
    { error: 'NF0', message: 'This user doesn\'t exists' },
    { error: 'IP0', message: 'Incorrect password' }
  ]
}
```
Hope you have understand.
 - valid: That parameter is the callback for checking the validity of the request, in this case, imagine my body is "OK", and my success is "OK" too:
```javascript
function valid(body, success) {
	return body === success
}
```
 - callback: That parameter contains two sub parameters: "type" and "message", if the valid callback return true, it will be return this: "type"="info" and "message"="success", and if the valid callback returns false, it will be return the error catched from the "errors" array of the authOptions.

When we combine all the parameters, we have a complete auth method:
```javascript
auth(authOptions, (body, success) => {
	return body === success
}, (type, message) => {
	if (type !== 'info') messageBox(type, ['Ok'], 'Launcher', message, (response, checked) => {})
	else {
		// Do download, or update...
	}
})
```

## Download and updates

You have to use the "update" method, seems like this:
`update(options, progress, finished)`
##### Parameters:
 - options: for process to update, you have to do 3 things, create an url that only return the version of your launcher, in your .server, add a 'vrs.id' with the same version, you have to put your launcher data in a .zip too. When this is done, you have to get the application folder, for all platforms, and proceed. This is an exemple of options:
```javascript
var loggedUser = process.env.username || process.env.user
var appdata = (getOS() === 'linux' ? '~/' : getOS() === 'macos' ? '~/Library/Application Support/' : 'C:/Users/' + loggedUser + '/AppData/Roaming/')

var updateOptions = {
	path: appdata+'.server',
	url: 'https://www.domain.tld/launcher.zip',
	target: appdata+'launcher.zip',
	versionURL: 'https://www.domain.tld/version.html'
}
```
 - progress: the progress parameter is just a callback, for the download progress, use it like this:
```javascript
function progress(receivedBytes, totalBytes) {
	var percentage = Math.round((receivedBytes * 100) / totalBytes)
	document.querySelector('p').innerHTML = percentage + '%'
}
```
  - finished: the last parameter, it's a callback, called when the download is finished, it's here you have to launch the game.

When we combine all the parameters, we have a complete update method:

```javascript
update({
      path: appdata+'.server',
      url: 'https://www.domain.tld/launcher.zip',
      target: appdata+'launcher.zip',
      versionURL: 'https://www.domain.tld/version.html'
    }, (rb, tb) => {
      var percentage = Math.round((rb * 100) / tb)
      document.querySelector('p').innerHTML = percentage + '%'
    }, () => {
      // Launch the game
    })
```

## Launching the game

This is how the "launchGame" method works:
`launchGame(src, options, callback)`
##### Parameters:
 - src: this is the root folder of your server's launcher, for minecraft, it's .minecraft, for your server, it's .server :)
 - options: the options, is the options to configure for launch the game, the ram, the mainClass, the version, and the username, if you want, you can use your own command for starting the game, fast example:
```javascript
var customLaunchGameOptions = {
  customCommand: 'java [...]'
}

var basicLaunchGameOptions = {
  ram: '-Xmx1G',
  mainClass: 'net.minecraft.main.Main',
  username: 'Player123',
  version: '1.7.10'
}
```
 - callback: It's basically the logs of your client.

When we combine all the parameters, we have a complete update method:

```javascript
launchGame(appdata+'.server', launchGameOptions, (error, stdout, stderr) => {})
```

### That's all !

## Combine all
After taking everything in hand, here's what your code should look like:
```javascript
auth(authOptions, (body, success) => {
	return body === success
}, (type, message) => {
	if (type !== 'info') messageBox(type, ['Ok'], 'Launcher', message, (response, checked) => {})
	else {
		update(updateOptions, (rb, tb) => {
	      var percentage = Math.round((rb * 100) / tb)
	      document.querySelector('p').innerHTML = percentage + '%'
	    }, () => {
	      launchGame(appdata+'.server', launchGameOptions, (error, stdout, stderr) => {})
	    })
	}
})
```

#### Yes, that's all.
