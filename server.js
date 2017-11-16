/**
 * Rove Monteux embeddable Web Server with automatic menu creation, folder indexing with pagination and embedded search engine.
 *
 * @license GPLv3, magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt 
 * @version 0.1
 * @author  Rove Monteux, https://monteux.cf/
 *
 */
var express = require('express');
var cookieParser = require('cookie-parser')
var showdown = require('showdown')
var fs = require('fs');
var recursive = require("recursive-readdir");
var recursiveReadSync = require('recursive-readdir-sync'),
    files;
var path = require('path');
var app = express();

app.use(cookieParser());
converter = new showdown.Converter();

var sitename = 'Rove Monteux';
var port = 8080;

Array.prototype.contains = function(needle) {
    for (i in this) {
        if (this[i] == needle) return true;
    }
    return false;
}

function getMenu() {
    var menu = '<div id="cssmenu"><ul><li><a href="/" class="blinkingtext">'+sitename+'</a></li>';
    files = recursiveReadSync('content');
    var folders = [];
    for (var i = 0; i < files.length; i++) {
        if (files[i].endsWith('.html')) {
            if (path.dirname(files[i]) === 'content') {
                menu = menu + '<li><a href="/' + files[i] + '">' + path.basename(files[i], path.extname(files[i])).replace(/_/g, ' ').trim() + '</a></li>';
            } else {
                if (!folders.contains(path.dirname(files[i]))) {
                    if (folders.length > 0) {
                        //menu = menu + "</li></ul>";

                    }
                    menu = menu + '<li class="active"><a href="/' + path.dirname(files[i]) + '/index">' + path.dirname(files[i]).replace('content/', '').replace(/_/g, ' ').trim() + '</a></li>';
                    //menu = menu = '<ul><li><a href="/'+files[i]+'">'+path.basename(files[i], path.extname(files[i])).replace('_',' ').trim()+'</li>';
                    folders.push(path.dirname(files[i]));
                } else {
                    //console.log('Adding inner content file from existing item.');
                    //menu = menu + '<li><a href="/'+files[i]+'">'+path.basename(files[i], path.extname(files[i]))+'</li>\n';
                }
            }
        }
    }
    //if (folders.length > 0) {
    //	menu = menu + "</ul></li>";
    //}
    menu = menu + '</ul></div>';
    return menu;
}

String.prototype.capitalize = function() {
    return this.replace(/(?:^|\s)\S/g, function(a) {
        return a.toUpperCase();
    });
};

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function title(name) {
    console.log('Name: ' + name);
    return '<title>' + path.basename(name, path.extname(name)).replace(/_/g, ' ').capitalize() + ' - ' + path.dirname(name).replace('content/', '').replace(/_/g, ' ').trim() + ' - '+sitename+'</title>\n';
}

function createIndex(name) {
    var result = '';
    console.log('Dir name: ' + path.dirname(name));
    var dirname = path.dirname(name);
    if (dirname === '.') {
        dirname = './content';
    }
    files = recursiveReadSync(dirname);
    if (path.dirname(name) === '.') {
        result = result + '<h1>'+sitename.toUpperCase()+'</h1>\n';
    } else {
        result = result + '<h1>' + dirname.replace(__dirname + '/content/', '').toUpperCase() + '</h1>';
    }
    result = result + '<table id="indexTable" cellspacing="1" class="tablesorter"><thead><tr><th>Page Name</th><th>Size</th><th>Author</th><th>Section</th><th>Date Created</th></tr></thead><tbody>\n';
    for (var i = 0; i < files.length; i++) {
        if (!(files[i].endsWith('index'))) {
            result = result + '<tr><td><a href="' + files[i].replace(__dirname, '') + '">' + capitalizeFirstLetter(path.basename(files[i], path.extname(files[i])).replace(/_/g, ' ')).trim() + '</a></td><td></td><td>'+sitename+'</td><td>IT/DEVELOPMENT</td><td></td></tr>\n';
        }
    }
    result = result + '</tbody></table>\n';
    result = result + '<div id="pager" class="pager"><form><img src="/images/first.png" class="first"/><img src="/images/prev.png" class="prev"/><input type="text" class="pagedisplay"/><img src="/images/next.png" class="next"/><img src="/images/last.png" class="last"/><select class="pagesize"><option selected="selected"  value="10">10</option><option value="20">20</option><option value="30">30</option><option  value="40">40</option></select></form></div>\n';
    return result;
}

function addGetHandler(endpoint, name) {
    app.get(endpoint, function(req, res) {
        var headOpen = fs.readFileSync('./templates/head_open.template').toString();
        var headClose = fs.readFileSync('./templates/head_close.template').toString();
        var bodyOpen = fs.readFileSync('./templates/body_open.template').toString().replace('##MENU##', getMenu());
        var bodyClose = fs.readFileSync('./templates/body_close.template').toString();
        fs.readFile(name, 'utf8', function(err, contents) {
            if (name.endsWith('.html')) {
                var response = headOpen + title(name) + headClose + bodyOpen + converter.makeHtml(contents) + bodyClose;
                res.send(response);
            } else if (name === 'index') {
                var response = headOpen + title(name) + headClose + bodyOpen + createIndex(name) + bodyClose;
                res.send(response);
            } else if (name === 'search') {
                var response = headOpen + title(name) + headClose + bodyOpen + converter.makeHtml(contents) + bodyClose;
                res.send(response);
            } else {
                res.send(contents);
            }
        });
    })
}

app.get('/content/*', function(req, res, path) {
    var contentpath = req.url,
        content = __dirname + contentpath;
    var headOpen = fs.readFileSync('./templates/head_open.template').toString();
    var headClose = fs.readFileSync('./templates/head_close.template').toString();
    var bodyOpen = fs.readFileSync('./templates/body_open.template').toString().replace('##MENU##', getMenu());
    var bodyClose = fs.readFileSync('./templates/body_close.template').toString();
    fs.readFile(content, 'utf8', function(err, contents) {
        if (content.endsWith('.html')) {
            var response = headOpen + title(content) + headClose + bodyOpen + converter.makeHtml(contents) + bodyClose;
            res.send(response);
        } else if (content.endsWith('index')) {
            var response = headOpen + title(content) + headClose + bodyOpen + createIndex(content) + bodyClose;
            res.send(response);
        }
    })
});

app.get('/images/*', function(req, res, path) {
    var imgpth = req.url,
        img = __dirname + imgpth;
    res.sendFile(img);
})

app.get('/css/*', function(req, res, path) {
    var csspth = req.url,
        css = __dirname + csspth;
    res.header("Content-Type", "text/css");
    res.sendFile(css);
})

app.get('/js/*', function(req, res, path) {
    var jspth = req.url,
        js = __dirname + jspth;
    res.header("Content-Type", "text/javascript");
    res.sendFile(js);
})

app.get('/fonts/*', function(req, res, path) {
    var fontpth = req.url,
        font = __dirname + fontpth;
    res.header("Content-Type", "application/octet-stream");
    res.sendFile(font);
})

addGetHandler('/', 'index');
addGetHandler('/', 'search');

recursive('.', function(err, items) {
    for (var i = 0; i < items.length; i++) {
        if (!items[i].startsWith('node_modules') && items[i].endsWith('.html')) {
            console.log(items[i]);
            addGetHandler('/' + items[i], items[i]);
        }
    }
});

var server = app.listen(port, function() {
    var host = server.address().address

    console.log("Rove Monteux embeddable Web Server listening on port %s at http://%s", port, host)
})
