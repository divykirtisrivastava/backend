let express = require('express')
let mysql = require('mysql')
let cors = require('cors')
let db = require('./databaseConfig.js')

let app = express()
app.use(express.json())
app.use(cors())

db.connect((err)=>{
    if(err) throw err
    else{
        console.log("database connected")
    }
})

const createDummyTable = `
  CREATE TABLE IF NOT EXISTS dummy (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL
  )
`;

db.query(createDummyTable, (err, result) => {
    if (err) {
      console.error('Error creating table:', err);
      return;
    }
    console.log('createDummyTable created successfully:');
  });


  app.listen(3000, ()=>{
    console.log("server is running")
  })