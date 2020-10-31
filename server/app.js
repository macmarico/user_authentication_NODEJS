const express = require('express');
const formData = require("express-form-data");
const { MongoClient } = require("mongodb");
const path = require('path');
const cors = require('cors');
const jwt = require ('jsonwebtoken');


const bcrypt = require('bcrypt');
const { static } = require('express');
const saltRounds = 13;

const app = express();
const PORT = process.env.PORT || 3000;
const uri = "mongodb+srv://manish:bi0hazard@cluster0.qqsro.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {useUnifiedTopology: true});

let options = {
    dotfiles: "ignore", //allow, deny, ignore
    etag: true,
    extensions: ["htm", "html"],
    index: false, //to disable directory indexing
    maxAge: "7d",
    redirect: false,
    setHeaders: function(res, path, stat) {
      //add this header to all static responses
      res.set("x-timestamp", Date.now());
    }
  };


app.use(formData.parse());
app.use(cors());
app.use(express.static('client',options));

async function authentication(req, res, next){
    const header = req.header('Authorization');
    console.log(header);
    if(header){
    const[type, token] = header.split(' ');
    if(type === 'bearer' && typeof token !== 'undefined'){
        try{
            let payload = jwt.verify(token, 'abcd');
            let current = Math.floor(Date.now() / 1000);
            let accessTime = current - payload.exp;
            let myObj = {
                name : payload.username,
                status : true,
                message : '',
                exp : accessTime,
            }
            res.status(201).send(JSON.stringify(myObj));
        } catch(err){
            let myObj = {
                name : payload.username,
                status : false,
                message : 'Invalid or expired token.',
            }
            console.log('Invalid token');
            res.status(401).send(JSON.stringify(myObj));
        
        }
        
    }else{
        console.log('Invalid token');
        let myObj = {
            status : false,
            message : 'Invalid token', 
        }
        res.status(401).send(JSON.stringify(myObj));


    }
}else{
    next();
}

}

app.post('/register', async (req, res)=>{
    await client.connect();
    const database = client.db('user');
    const collection = database.collection('user');
       
    const userMatch = await collection.find({
        username: req.body.username,
      });

      console.log(await userMatch.count());
    if(await userMatch.count() == 0){
        let passHash = await bcrypt.hash(req.body.password, saltRounds);
        let newUser = {
            username : req.body.username,
            email : req.body.email,
            password : passHash,
        }
        let myObj = {
            name : req.body.username,
            status : true,
            message : '',
        }

        const result = await collection.insertOne(newUser);
        console.dir(result.insertedCount);
        console.log('Full user list');
        let limit = 60 * 3;
        let expires = Math.floor(Date.now() / 1000)+ limit;
        let payload = {
            username : req.body.username,
            exp : expires,
        }
        let token = jwt.sign(payload, 'abcd');
        myObj.token = token;
        res.status(201).send(JSON.stringify(myObj));
    }else{
        let myObj = {
            name : req.body.username,
            status : false,
            message : 'username not available',
        }
        console.log('username not available');
        res.status(201).send(JSON.stringify(myObj));
    }
    
});


app.post('/login', async (req, res)=>{

    await client.connect();
    const database = client.db('user');
    const collection = database.collection('user');
       
    const userMatch = await collection.findOne({
        username: req.body.username,
      });

    if(await userMatch != null){
        let submittedPass = req.body.password;
        let savedPass = userMatch.password;
        let passwordDidMatch = await bcrypt.compare(submittedPass, savedPass);
        if(passwordDidMatch){
            let myObj = {
                name : req.body.username,
                status : true,
                message : '', 
            }
            console.log('Full user list');
            let limit = 60 * 3;
            let expires = Math.floor(Date.now() / 1000)+ limit;
            let payload = {
                username : req.body.username,
                exp : expires,
            }
            let token = jwt.sign(payload, 'abcd');
            myObj.token = token;
            res.status(201).send(JSON.stringify(myObj));
        }else{
            let myObj = {
                name : req.body.username,
                status : false,
                message : 'wrong username or password', 
            }
            console.log('Full user list', users);
            res.status(401).send(JSON.stringify(myObj));

        }

    }else{
        let myObj = {
            name : req.body.username,
            status : false,
            message : 'wrong username or password',
        }
        console.log('username not matched');
        res.status(201).send(JSON.stringify(myObj));
    }
    
});


app.get('/', authentication, (req, res)=>{
    res.sendFile(path.resolve('client/index.html'));
});


app.listen(PORT, function (err) {
    if (err) {
      console.error('Failure to launch server');
      return;
    }
    console.log(`Listening on port ${PORT}`);
  });