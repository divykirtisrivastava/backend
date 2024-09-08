let mysql = require('mysql')

let connection = mysql.createConnection({
    host:"localhost",
    user:"root",
    database:"wealthhify"
})

module.exports = connection;