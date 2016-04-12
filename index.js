var fs   = require('fs-extra');
var args = process.argv.slice(2);

init();

function init(){
    fs.readJson("./versionUpdaterConfig.json", function(err, config){
        if (err){
            if (err.code == 'ENOENT'){
                console.log("versionUpdaterConfig : Config does not exist. Creation of default config file 'versionUpdaterConfig.json'. Please complete it.");
                fs.writeJson('./versionUpdaterConfig.json', getDefaultConfig(), function (err) {
                    if (err) {
                        console.log(err)
                    }
                });
                return;
            }

            console.log("ConfigException : " + err);
            return;
        }


        updateFileVersionFromConfig(config);
    });
}



function updateFileVersionFromConfig(config){
    fs.readJson(config.filePath, function(err, fileToUpdate){
        if (err){
            console.log(err);
            return;
        }

        var subProperties = config.subPropertiesPath.split(".");
        subProperties.shift();

        var obj = fileToUpdate;
        var subProperty;
        var lastObj;

        for (var i = 0; i < subProperties.length; i++){
            subProperty = subProperties[i];

            if (obj[subProperty]){
                lastObj = obj;
                obj     = obj[subProperty];
            } else {
                console.error("SubProperties " + config.subPropertiesPath + " does not exist on file " + config.filePath + ", subProperty not found : " + subProperty);
                return;
            }
        }

        var oldVersion = obj;
        var versions   = arrayVersionFromObjVersion(obj);

        if (!versions){
            return;
        }

        var newVersion       = getNextStringVersionFromVersionsAndType(versions, args[0]);        
        lastObj[subProperty] = newVersion;

        fs.writeJson(config.filePath, fileToUpdate ,function (err){
            if (err){
                console.error(err);
            } else {
                console.log("Update version " + oldVersion + " to " + newVersion + " on " + config.filePath);
            }
        });
    });
}


function arrayVersionFromObjVersion(obj){
    var errorMsg = "obj is not a valid version ! obj : " + obj + ", valid version format : '0.0.0'";

    if (typeof(obj) != "string"){
        console.error(errorMsg);
        return false;
    }

    var versions = obj.split('.');

    if (versions.length != 3){
        console.error(errorMsg);
        return false;
    }

    var intRegex = /^\+?(0|[1-9]\d*)$/;

    for (var i in versions){
        if (!intRegex.test(versions[i])){
            console.error("Sub numbers of version must be integer");
            return false;
        } else {
            versions[i] = parseInt(versions[i]);
        }
    }    

    return versions;
}


function getNextStringVersionFromVersionsAndType(versions, versionType){
    if (versionType == "major"){
        versions[0]++;
    }
    else if (versionType == "minor"){
        versions[1]++;
    }
    else {
        versions[2]++;
    }

    return versions[0] + "." + versions[1] + "." + versions[2];
}


function getDefaultConfig(){
    return {
        filePath          : "myFileWithVersion.json",
        subPropertiesPath : ".version"
    };
}