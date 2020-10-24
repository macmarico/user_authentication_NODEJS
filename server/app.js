const express = require('express');
const formData = require("express-form-data");
const cors = require('cors');
const jwt = require ('jsonwebtoken');
const users = require('./data.js').users;

const bcrypt = require('bcrypt');
const saltRounds = 13;

const app = express();
const PORT = process.env.PORT || 3000;
app.use(formData.parse());
app.use(cors());

app.post('/register', async (req, res)=>{
    const userMatch = users.find((user)=> req.body.username === user.username);
    if(!userMatch){
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
        users.push(newUser);
        console.log('Full user list', users);
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
    const userMatch = users.find((user)=> req.body.username === user.username);
    if(userMatch){
        let submittedPass = req.body.password;
        let savedPass = userMatch.password;
        let passwordDidMatch = await bcrypt.compare(submittedPass, savedPass);
        if(passwordDidMatch){
            let myObj = {
                name : req.body.username,
                status : true,
                message : '', 
            }
            console.log('Full user list', users);
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


app.post('/', (req, res)=>{
    const header = req.header('Authorization');
    console.log(header);
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

});


app.listen(PORT, function (err) {
    if (err) {
      console.error('Failure to launch server');
      return;
    }
    console.log(`Listening on port ${PORT}`);
  });