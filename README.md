# Appaloosa Client for node.js

Publish your apps into your [Appaloosa](http://appaloosa-store.com) Store 

## Installation

    npm install appaloosa-client
    
## Usage

```    
const appaloosa = require('appaloosa-client');
    
...
    
const token = '{APPALOOSA_TOKEN}';
const filepath = '{PATH_TO_YOUR_PACKAGE}/android/build/outputs/apk/release/android-release.apk';
const groups = [ '{APPALOOSA_GROUP}' ];
const changes = '{CHANGELOG}';
    
...
    
appaloosa.upload(token, filepath, groups, changes);
```
