let express = require('express')
let mysql = require('mysql')
let cors = require('cors')
let db = require('./databaseConfig.js')
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const bodyParser = require('body-parser');

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
    nomineeRelationship,
  } = req.body;

  // Ensure files are uploaded to Cloudinary
  const documentFrontFile = req.files['documentFrontFile'] ? req.files['documentFrontFile'][0].path : null;
  const documentBackFile = req.files['documentBackFile'] ? req.files['documentBackFile'][0].path : null;

  // Simple validation
  if (!firstName || !lastName || !email || !password || password !== confirmPassword) {
    return res.status(400).send('Invalid form data');
  }

  // Insert into MySQL
  const sql = `
    INSERT INTO usersdata (
      firstName, lastName, dob, motherName, number, email, documentType, documentNumber, 
      documentFrontFile, documentBackFile, password, nomineeName, nomineeEmail, nomineeNumber, nomineeRelationship
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    res.json(results[0]);
  });
});
// GET: Retrieve user by ID
app.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  const query = 'SELECT * FROM usersdata WHERE id = ?';

  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(results[0]);
  });
});

// PUT: Update user by ID
app.put('/updateusers/:id', upload.fields([{ name: 'documentFrontFile' }, { name: 'documentBackFile' }]), async (req, res) => {
  const userId = req.params.id;
  const formData = req.body;
  const files = req.files;
  
  try {
    // Upload files to Cloudinary if they exist
    if (files.documentFrontFile) {
      const frontUploadResult = await cloudinary.uploader.upload(files.documentFrontFile[0].path);
      formData.documentFrontFile = frontUploadResult.secure_url;
      fs.unlinkSync(files.documentFrontFile[0].path); // Remove the file from the server
    }
    if (files.documentBackFile) {
      const backUploadResult = await cloudinary.uploader.upload(files.documentBackFile[0].path);
      formData.documentBackFile = backUploadResult.secure_url;
      fs.unlinkSync(files.documentBackFile[0].path); // Remove the file from the server
    }

    const query = `
      UPDATE usersdata 
      SET firstName = ?, lastName = ?, dob = ?, motherName = ?, number = ?, email = ?, 
          documentType = ?, documentNumber = ?, documentFrontFile = ?, documentBackFile = ?, 
          password = ?, nomineeName = ?, nomineeEmail = ?, nomineeNumber = ?, nomineeRelationship = ? 
      WHERE id = ?
    `;
    const values = [
      formData.firstName, formData.lastName, formData.dob, formData.motherName, formData.number,
      formData.email, formData.documentType, formData.documentNumber, formData.documentFrontFile,
      formData.documentBackFile, formData.password, formData.nomineeName, formData.nomineeEmail,
      formData.nomineeNumber, formData.nomineeRelationship, userId
    ];

    db.query(query, values, (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'User updated successfully' });
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
    password VARCHAR(255) NOT NULL,
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

app.post('/savetrade', (req, res)=>{
    let name = req.body.name
    let email = req.body.email
    let value = [[name , email]]
    let sql = "insert into dummy(name, email) values ?"
    db.query(sql, [value], (err, result)=>{
        if(err) throw err
        else{
            res.send("data save")
        }
    })
})
app.get('/gettrade', (req, res)=>{
    let sql = "select * from dummy"
    db.query(sql, [value], (err, result)=>{
        if(err) throw err
        else{
            res.json(result)
        }
    })
})
  app.listen(3000, ()=>{
    console.log("server is running")
  })