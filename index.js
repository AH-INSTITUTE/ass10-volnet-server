const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const fileUpload = require('express-fileupload');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const fs = require('fs');
require('dotenv').config();


//mongo DB info
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ubnkj.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

//path 
const path = require('path');
const { response } = require('express');
const directoryPath = path.join(__dirname, "/Public/UploadImg/");

//use App
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(fileUpload());
app.use(express.static(__dirname + '/Public/UploadImg/'));

//default directory
app.get('/', (req, res) => {
    res.send("ABU HASAN")
})

//database area
client.connect(err => {
    //admin data base
    const volunteerAdminData = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_ADMIN_COLLECTION}`);
    //public data base
    const volunteerPublicData = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_PUBLIC_COLLECTION}`);

    //database post admin add event data 
    app.post('/createEvent', (req, res) => {
        const upFile = req.files.imgUpload;
        try {
            fs.readdir(directoryPath, (err, filed) => {
                if (err) {
                    return console.log('Unable to scan directory: ' + err);
                }
                const FoundImg = filed.find(img => img == upFile.name);
                if (FoundImg) {
                    return res.json({ exists: true })
                }
                if (FoundImg == undefined) {
                    upFile.mv("Public/UploadImg/" + upFile.name, err => {
                        if (err) {
                            return res.json({ "status": "Img No Uploaded" });
                        } else {
                            evtObj = {
                                eventTitle: req.body.eventTitle,
                                description: req.body.description,
                                eventDate: req.body.eventDate,
                                imgUpload: upFile.name
                            }
                            volunteerAdminData.insertOne(evtObj)
                                .then(() => {
                                    res.json({ exists: false })
                                })
                        }
                    })
                }
            });
        } catch (err) {
            res.json({ err: err })
        }
    });

    //get all event
    app.get('/allEvent', (req, res) => {
        volunteerAdminData.find({})
            .toArray((err, docs) => {
                res.send(docs);
            })
    })

    //Register Volunteer Data Post
    app.post('/register-volunteer', (req, res) => {
        const registerData = req.body.formData;
        volunteerPublicData.insertOne(registerData)
            .then(() => {
                res.json({ success: true })
            })
    })

    //get user Volunteer Registration data
    app.get('/user-volunteer-registration/', (req, res) => {
        volunteerPublicData.find({ email: req.query.email })
            .toArray((err, docs) => {
                res.send(docs);
            })
    })

    //get all Volunteer Registration data
    app.get('/all-volunteer-registration/', (req, res) => {
        volunteerPublicData.find({})
            .toArray((err, docs) => {
                res.send(docs);
            })
    })

    //delete
    app.delete('/delete-vol-reg/:id', (req, res) => {
        volunteerPublicData.deleteOne({_id: ObjectId(req.params.id) })
            .then(() => {
                res.send({ success: true})
            })
    })
});

app.listen(5000);
