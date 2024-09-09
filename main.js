let express = require('express')
let mysql = require('mysql')
let cors = require('cors')
let db = require('./databaseConfig.js')
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const bodyParser = require('body-parser');
let path= require('path')

let app = express()
app.use(express.json())
app.use(cors())

cloudinary.config({
  cloud_name: 'dndulnhuh',  // Replace with your Cloudinary cloud name
  api_key: '123788544118816',        // Replace with your Cloudinary API key
  api_secret: 'aWJExgmzZQh5H7FuzvxVQroXqd0'   // Replace with your Cloudinary API secret
});

db.connect((err)=>{
    if(err) throw err
    else{
        console.log("database connected")
    }
})
// Set up Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads',  // Folder in Cloudinary where files will be stored
    format: async (req, file) => 'png',  // Force format, e.g., png
    public_id: (req, file) => file.fieldname + '-' + Date.now(), // Generate a unique ID
  },
}); 
const upload = multer({ storage: storage });

app.post('/register', upload.fields([{ name: 'documentFrontFile' }, { name: 'documentBackFile' }]), (req, res) => {
  const {
    firstName,
    lastName,
    dob,
    motherName,
    number,
    email,
    documentType,
    documentNumber,
    password,
    confirmPassword,
    nomineeName,
    nomineeEmail,
    nomineeNumber,
    nomineeRelationship
  } = req.body;
console.log(req.file )
  // Ensure files are uploaded to Cloudinary
  const documentFrontFile = req.files['documentFrontFile'] ? req.files['documentFrontFile'][0].path : null;
  const documentBackFile = req.files['documentBackFile'] ? req.files['documentBackFile'][0].path : null;
console.log(documentFrontFile)
console.log(documentBackFile)
  // Simple validation
  if (!firstName || !lastName || !email || !password || password !== confirmPassword) {
    return res.status(400).send('Invalid form data');
  }

  // Insert into MySQL
  const sql = `
    INSERT INTO usersdata (
      firstName, lastName, dob, motherName, number, email, documentType, documentNumber, 
      documentFrontFile, documentBackFile, password, nomineeName, nomineeEmail, nomineeNumber, nomineeRelationship
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    firstName, lastName, dob, motherName, number, email, documentType, documentNumber,
    documentFrontFile, documentBackFile, password, nomineeName, nomineeEmail, nomineeNumber, nomineeRelationship,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      return res.status(500).send('Server error');
    }
    res.status(201).send('User signed up successfully');
  });
});

// GET: Retrieve user 
app.get('/allusers', (req, res) => {
  const userId = req.params.id;
  const query = 'SELECT * FROM usersdata';

  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(results);
  });
});
// GET: Retrieve user by email
app.get('/users/:email', (req, res) => {
  const userId = req.params.email;
  const query = 'SELECT * FROM usersdata WHERE email = ?';

  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(results);
  });
});

// PUT: Update user by ID
app.put('/updateusers/:id',  (req, res) => {
  const userId = req.params.id;
  const formData = req.body;
  try {
  

    const query = `
      UPDATE usersdata 
      SET  ? 
      WHERE id = ?
    `;


    db.query(query, [formData, userId], (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (results.affectedRows === 0) {
        return res.send(false);
      }
      res.send(true);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.put('/updateusersdata/:email',  (req, res) => {
  const userId = req.params.email;
  const formData = req.body;
  console.log(formData)
  try {
  

    const query = `
      UPDATE usersdata 
      SET  ? 
      WHERE email = ?
    `;


    db.query(query, [formData, userId], (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (results.affectedRows === 0) {
        return res.send(false);
      }
      res.send(true);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// PUT: Update payment
app.put('/updatepayment/:email', upload.fields([{ name: 'documentAmountFile' }]), async (req, res) => {
  const email = req.params.email;
  const balance = req.body.amount;
  const documentAmountFile = req.files['documentAmountFile'] ? req.files['documentAmountFile'][0].path : null;

  
  try {

    const query = `
      UPDATE usersdata 
      SET accountBalance = ?,  documentAmountFile = ?
      WHERE email = ?
    `;


    db.query(query, [balance,documentAmountFile, email], (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (results.affectedRows === 0) {
        return res.send(false);
      }
      res.send(true);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE: Delete user by ID
app.delete('/deleteusers/:id', (req, res) => {
  const userId = req.params.id;
  const query = 'DELETE FROM usersdata WHERE id = ?';

  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  });
});

//login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
console.log(req.body)
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Check if the user exists
  const query = 'SELECT * FROM usersdata WHERE email = ? and password = ?';
  db.query(query, [email, password], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }

    if (results.length === 0) {
      return res.send(false);
    }else{
      res.status(200).send(true);
    }
  });
});


// withdraw api
app.post('/withdraw', (req, res) => {
  const { email, amount } = req.body;

  if (!email || !amount) {
    return res.status(400).json({ error: 'Email and amount are required' });
  }

  const query = `INSERT INTO withdrawdata (email, amount) VALUES (?, ?)`;
  db.query(query, [email, amount], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ message: 'Withdrawal request created', id: result.insertId });
  });
});
app.put('/withdraw/:id', (req, res) => {
  const { id } = req.params;
  const { actionStatus } = req.body;

  if (!actionStatus) {
    return res.status(400).json({ error: 'actionStatus is required' });
  }

  const query = `UPDATE withdrawdata SET actionStatus = ? WHERE id = ?`;
  db.query(query, [actionStatus, id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }

    res.status(200).json({ message: 'Withdrawal request updated successfully' });
  });
});
app.get('/getwithdraw', (req, res) => {

  const query = `select * from withdrawdata`;
  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }else{
      res.status(200).json(result);
    }
  });
});


app.post('/saveadmin', (req, res)=>{
  let email = req.body.email
  let password = req.body.password

  let value = [[email, password]]

  db.query('insert into admin(email, password) values ?', [value], (err, result)=>{
    if(err) throw err
    else{
      res.send("data saved")
    }
  })
})
app.post('/adminlogin', (req, res) => {
  const { email, password } = req.body;
console.log(req.body)
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Check if the user exists
  const query = 'SELECT * FROM admin WHERE email = ? and password = ?';
  db.query(query, [email, password], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }

    if (results.length === 0) {
      return res.send(false);
    }else{
      res.status(200).send(true);
    }
  });
});

const createDummyTable = `
  CREATE TABLE if not exists usersdata (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) NOT NULL,
    dob DATE NOT NULL,
    motherName VARCHAR(255),
    number VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    documentType  VARCHAR(255) ,
    documentNumber VARCHAR(100) NOT NULL,
    documentFrontFile TEXT NOT NULL,
    documentBackFile TEXT NOT NULL,
    documentAmountFile TEXT DEFAULT 'null',
    password VARCHAR(255) NOT NULL,
    accountBalance VARCHAR(255) DEFAULT 0,
    accountStatus VARCHAR(255) DEFAULT 'pending',
    nomineeName VARCHAR(255),
    nomineeEmail VARCHAR(255),
    nomineeNumber VARCHAR(20),
    nomineeRelationship VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

`;

db.query(createDummyTable, (err, result) => {
    if (err) {
      console.error('Error creating table:', err);
      return;
    }
    console.log('createDummyTable created successfully:');
  });
const createWithdrawTable = `
  CREATE TABLE if not exists withdrawdata (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    actionStatus VARCHAR(255) DEFAULT 'pending',
    amount VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

`;

db.query(createWithdrawTable, (err, result) => {
    if (err) {
      console.error('Error creating table:', err);
      return;
    }
    console.log('createWithdrawTable created successfully:');
  });
const createAdminTable = `
  CREATE TABLE if not exists admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255)
    );

`;

db.query(createAdminTable, (err, result) => {
    if (err) {
      console.error('Error creating table:', err);
      return;
    }
    console.log('admin created successfully:');
  });

  app.listen(4000, ()=>{
    console.log("server is running")
  })