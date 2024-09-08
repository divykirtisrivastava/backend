let mysql = require('mysql')

let connection = mysql.createConnection({
    host:"localhost",
    user:"root",
    database:"wealthhify",
    password:"1234"
})

module.exports = connection;