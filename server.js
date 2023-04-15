

//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
mongoose.set('strictQuery', false);

//google login STEP-1
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");


// cookies session setups  STEP-1
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const { test } = require("media-typer");
const { boolean } = require("webidl-conversions");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));


//user logged through username and password 
var loggedUser = null;

//user logged through google 
var loggedUser2 = null;

//user logged status
var isLogged = false;
var userName = null;

//admin logged
var isAdminLogged = false;



//cookie session setup STEP-2
app.use(session({
    secret: "my little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://saifustad12345:saifustad@healthcarecluster.ddkryq9.mongodb.net/Healthcare");


//feature page schemas

const equipmentSchema = mongoose.Schema({
    EquipmentId: Number,
    Title: String,
    Rent: Number,
    Location: String,
    EquipmentImage: String,
    Description: String,
    Select_Equipment: String
})

const Equipment = mongoose.model("equipment", equipmentSchema);


const labSchema = mongoose.Schema({
    Id: Number,
    Name: String,
    Location: String,
    Rating: String,
    Available_time: String,
    Book_slot: String
});

const Lab = mongoose.model("lab", labSchema);


const nursesSchema = mongoose.Schema({
    NurseId: Number,
    Name: String,
    contact: String,
    Qualification: String,
    Experience: String,
    Rating: String,
    Location: String,
    Availability: String,
    Charges: Number,
    Request: String
})

const Nurse = mongoose.model("nurse", nursesSchema);


const userSchema = mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    secret: String,
    charges: { purpose: String, bill: String },
    // equipment: { equipment_type: String, equipment_rent: String },
    insurence: { insurence_company: String, health_issue: String },
    // lab: { lab_name: String, test: String },
    medicine: { medicine_name: String, medicine_bill: String },
    // nurse: { nurse_name: String, nurse_fee: String }

    booked_items: { equipmentSchema1: equipmentSchema, labSchema1: labSchema, nursesSchema1: nursesSchema }
});




//cookie setup STEP-3
userSchema.plugin(passportLocalMongoose);

//google login / findorcreate setup
userSchema.plugin(findOrCreate);

const User = mongoose.model("user", userSchema);

//cookie setup STEP-4
passport.use(User.createStrategy());

//google login STEP-4
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

//google login STEP-2
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://medicare4u.onrender.com/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        loggedUser2 = profile.id;
        isLogged = true;
        userName = profile.displayName;
        console.log(profile);
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get("/", function (req, res) {
    res.render('home', { isUserLogged: { status: isLogged, name: userName } });
    // res.send("Hello World");
});

//google login STEP-3
app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile"] }));

app.get("/auth/google/secrets",
    passport.authenticate("google", { failureRedirect: "/login" }),
    function (req, res) {
        // Successful authentication, redirect secrets.

        res.redirect("/secrets");
    });


app.get("/about", function (req, res) {
    res.render('about', { isUserLogged: { status: isLogged, name: userName } });
});

app.get("/doctors", function (req, res) {
    res.render('doc', { isUserLogged: { status: isLogged, name: userName } });
});

app.get("/contact", function (req, res) {
    res.render('contact', { isUserLogged: { status: isLogged, name: userName } });
});

app.get("/admin", function (req, res) {
    if(isAdminLogged == true){
        res.render('admin_page', { isUserLogged: { status: isLogged, name: userName } });
    }else{
        res.redirect("/login");
    }
    
});

app.get("/add_equipment", function (req, res) {
    res.render('admin/add_equipment', { isUserLogged: { status: isLogged, name: userName } });
});

app.get("/add_lab", function (req, res) {
    res.render('admin/add_lab', { isUserLogged: { status: isLogged, name: userName } });
});

app.get("/add_nurse", function (req, res) {
    res.render('admin/add_nurse', { isUserLogged: { status: isLogged, name: userName } });
});

app.get("/login", function (req, res) {
    res.render('login', { isUserLogged: { status: isLogged, name: userName } });
});

app.get("/register", function (req, res) {
    res.render('register', { isUserLogged: { status: isLogged, name: userName } });
});


//features pages get request

app.get("/charges", function (req, res) {
    if (isLogged == true) {
        res.render('features/charges', { isUserLogged: { status: isLogged, name: userName } });
    } else {
        res.redirect("/login");
    }

});

app.get("/equipment", function (req, res) {
    if (isLogged == true) {
        Equipment.find(function (err, Equipments) {
            if (err) {
                console.log(err);
            } else {
                if (Equipments) {
                    res.render('features/equipment', { isUserLogged: { status: isLogged, name: userName }, Equipments });
                }
            }
        });


    } else {
        res.redirect("/login");
    }
});

app.get("/insurence", function (req, res) {
    if (isLogged == true) {
        res.render('features/insurence', { isUserLogged: { status: isLogged, name: userName } });
    } else {
        res.redirect("/login");
    }
});

app.get("/lab", function (req, res) {
    if (isLogged == true) {
        Lab.find(function (err, Labs) {
            if (err) {
                console.log(err);
            } else {
                if (Labs) {
                    res.render('features/lab', { isUserLogged: { status: isLogged, name: userName }, Labs });
                }
            }
        });
    } else {
        res.redirect("/login");
    }
});

app.get("/medicines", function (req, res) {
    if (isLogged == true) {
        res.render('features/medicines', { isUserLogged: { status: isLogged, name: userName } });
    } else {
        res.redirect("/login");
    }
});

app.get("/nurses", function (req, res) {

    if (isLogged == true) {
        Nurse.find(function (err, Nurses) {
            if (err) {
                console.log(err);
            } else {
                if (Nurses) {
                    res.render('features/nurses', { isUserLogged: { status: isLogged, name: userName }, Nurses });
                }
            }
        });
    } else {
        res.redirect("/login");
    }
});

app.get("/all_features", function (req, res) {
    if (loggedUser2 != null) {
        User.find({ "googleId": loggedUser2 }, function (err, foundUsers) {
            if (err) {
                console.log(err);
            } else {
                if (foundUsers) {
                    res.render("features/all_features", { usersWithSecrets: foundUsers, isUserLogged: { status: isLogged, name: userName } });
                }
            }
        });
    } 
    else if (loggedUser != null) {
        User.find({ "username": loggedUser }, function (err, foundUsers) {
            if (err) {
                console.log(err);
            } else {
                if (foundUsers) {
                    res.render("features/all_features", { usersWithSecrets: foundUsers, isUserLogged: { status: isLogged, name: userName } });
                }
            }
        });
    } else {
        res.redirect("/login");
    }
});

//features page post request

app.post("/charges", function (req, res) {

    purpose = req.body.purpose_of_payment;
    bill = req.body.total_bill;

    User.findById(req.user.id, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.charges.purpose = purpose;
                foundUser.charges.bill = bill;
                foundUser.save(function () {
                    res.redirect("/all_features");
                });
            }
        }
    });
});

app.post("/equipment", function (req, res) {

    // equipment_type = req.body.equipment_type;
    // equipment_rent = req.body.equipment_rent;
    var EquipmentId = req.body.EquipmentId;

    Equipment.findOne({ "EquipmentId": EquipmentId }, function (err, foundEquipment) {
        if (err) {
            console.log(err);
        } else {
            if (foundEquipment) {
                User.updateOne({ _id: req.user.id }, { $set: { "booked_items.equipmentSchema1": foundEquipment } }, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.redirect("/all_features");
                    }
                });
            }
        }
    });

});



app.post("/insurence", function (req, res) {


    insurence_company = req.body.insurence_company;
    health_issue = req.body.health_issue;

    User.findById(req.user.id, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.insurence.insurence_company = insurence_company;
                foundUser.insurence.health_issue = health_issue;
                foundUser.save(function () {
                    res.redirect("/all_features");
                });
            }
        }
    });
});

app.post("/lab", function (req, res) {

    // lab_name = req.body.lab_name;
    // lab_test = req.body.lab_test;
    var LabId = req.body.LabId;

    Lab.findOne({ "Id": LabId }, function (err, foundLab) {
        if (err) {
            console.log(err);
        } else {
            if (foundLab) {
                User.updateOne({ _id: req.user.id }, { $set: { "booked_items.labSchema1": foundLab } }, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.redirect("/all_features");
                    }
                });
            }
        }
    });

});

app.post("/medicines", function (req, res) {

    medicine_name = req.body.medicine_name;
    medicine_bill = req.body.medicine_bill;

    User.findById(req.user.id, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.medicine.medicine_name = medicine_name;
                foundUser.medicine.medicine_bill = medicine_bill;
                foundUser.save(function () {
                    res.redirect("/all_features");
                });
            }
        }
    });
});

app.post("/nurses", function (req, res) {

    // nurse_name = req.body.nurse_name;
    // nurse_fee = req.body.nurse_fee;

    var NurseId = req.body.NurseId;

    Nurse.findOne({ "NurseId": NurseId }, function (err, foundNurse) {
        if (err) {
            console.log(err);
        } else {
            if (foundNurse) {
                User.updateOne({ _id: req.user.id }, { $set: { "booked_items.nursesSchema1": foundNurse } }, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.redirect("/all_features");
                    }
                });
            }
        }
    });

});



app.post("/add_equipment", function (req, res) {
    const equipment1 = new Equipment({
        EquipmentId: req.body.EquipmentID,
        Title: req.body.Title,
        Rent: req.body.rent,
        Location: req.body.location,
        EquipmentImage: req.body.EquipmentImage,
        Description: req.body.description,
        Select_Equipment: "Book"
    });



    Equipment.findOne({ "EquipmentId": req.body.EquipmentID }, function (err, foundEquipment) {
        if (err) {
            console.log(err);
        } else {
            if (foundEquipment) {

            } else {
                equipment1.save();
            };
        }
        })

            
        res.redirect("/equipment");
});



app.post("/add_lab", function (req, res) {
    
    const lab1 = new Lab({
        Id: req.body.labId,
        Name: req.body.labName,
        Location: req.body.labLocation,
        Rating: req.body.labRatings,
        Available_time: req.body.availableTime,
        Book_slot: "Book"
    });

    Lab.findOne({ "Id": req.body.labId }, function (err, foundLab) {
        if (err) {
            console.log(err);
        } else {
            if (foundLab) {

            } else {
                lab1.save();
            };
        }
        })

        res.redirect("/lab");
});



app.post("/add_nurse", function (req, res) {
        
    const nurse1 = new Nurse({
        NurseId: req.body.id,
        Name: req.body.name,
        contact: req.body.contact,
        Qualification: req.body.qualification,
        Experience: req.body.experience,
        Rating: req.body.rating,
        Location: req.body.location,
        Availability: req.body.availabel,
        Charges: req.body.charges,
        Request: "Request"
    });

    

    Nurse.findOne({ "NurseId": req.body.id }, function (err, foundNurse) {
        if (err) {
            console.log(err);
        } else {
            if (foundNurse) {

            } else {
                nurse1.save();
            };
        }
        })

        res.redirect("/nurses");
});


//////////////////////////////////////////////////////////////



app.get("/secrets", function (req, res) {

    // User.find({ "secret": { $ne: null } }, function (err, foundUsers) {

    if (loggedUser != null) {
        User.find({ "username": loggedUser }, function (err, foundUsers) {
            if (err) {
                console.log(err);
            } else {
                if (foundUsers) {
                    res.render("secrets", { usersWithSecrets: foundUsers, isUserLogged: { status: isLogged, name: userName } });
                }
            }
        });
    }
    else if (loggedUser2 != null) {
        User.find({ "googleId": loggedUser2 }, function (err, foundUsers) {
            if (err) {
                console.log(err);
            } else {
                if (foundUsers) {
                    res.render("secrets", { usersWithSecrets: foundUsers, isUserLogged: { status: isLogged, name: userName } });
                }
            }
        });
    }
    else {
        res.redirect("/login");
    }
});


app.get("/submit", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("submit", { isUserLogged: { status: isLogged, name: userName } });
    } else {
        res.redirect("/login");
    }
});

app.post("/submit", function (req, res) {
    const submittedSecret = req.body.secret;

    //Once the user is authenticated and their session gets saved, their user details are saved to req.user.
    // console.log(req.user.id);

    User.findById(req.user.id, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.secret = submittedSecret;
                foundUser.save(function () {
                    res.redirect("/secrets");
                });
            }
        }
    });
});

app.get("/logout", function (req, res, next) {
    loggedUser = null;
    loggedUser2 = null;
    isLogged = false;
    userName = null;
    isAdminLogged = null;
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});

app.post("/register", function (req, res) {

    //cookies login code STEP-5
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.send(" A user with the given username is already registered");
            // res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                isLogged = true;
                userName = req.body.username;
                loggedUser = req.body.username;
                if(req.body.username == "admin@gmail.com" && req.body.password == "admin"){
                    isAdminLogged = true;
                    res.render("admin_page", {isUserLogged: { status: isLogged, name: userName } });
                }else{
                    // User.find({ "username": req.body.username }, function (err, foundUsers) {
                    //     if (err) {
                    //         console.log(err);
                    //     } else {
                    //         if (foundUsers) {
                    //             res.render("secrets", { usersWithSecrets: foundUsers, isUserLogged: { status: isLogged, name: userName } });
                    //         }
                    //     }
                    // });
                    res.redirect("/secrets");
                }
            })
        }
    });
});

app.post("/login", function (req, res) {

    loggedUser = req.body.username; // logged user id
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                isLogged = true;
                userName = req.body.username;
                if(req.body.username == "admin@gmail.com" && req.body.password == "admin"){
                    isAdminLogged = true;
                    res.render("admin_page", {isUserLogged: { status: isLogged, name: userName } });
                }else{
                    res.redirect("/secrets");
                }
                
            })

        }
    })
})

app.listen(process.env.PORT || 3000, function () {
    console.log("server has been started on port 3000");
});
