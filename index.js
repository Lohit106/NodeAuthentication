//const express = require("express")
//const path = require("path")

import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
//for parsing data..
import bodyParser from "body-parser";

const app = express();

app.use(express.static(path.join(path.resolve(), "public")))
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(cookieParser())
app.set("view engine", "ejs");

mongoose.connect("mongodb://127.0.0.1:27017/example2").then(()=>{
    console.log("MongoDB connected");
}).catch((e)=>{
    console.log(e);
})

const usrschema = new mongoose.Schema({
    FirstName: String,
    SndName: String,
    email : String,
    password : String
})

const user = mongoose.model("User", usrschema);

const data = [];

const isauth = async(req,res,next)=>{
        const {token} = req.cookies;
        if(token){
            const decd = jwt.verify(token,"qwertyuiopkjhgfdsa")
            req.user = await user.findById(decd._id);
            next();
        }
        else{
            res.redirect("/login")
        }
};

app.get("/",isauth,(req,res)=>{
    //console.log(req.body.SndName)
    res.render("logout",{name : req.user.SndName})
})

app.get("/login",(req,res)=>{
    res.render("login")
})

app.get("/register",(req,res)=>{
    res.render("register")
})

app.post("/register",async(req,res)=>{
    const {FirstName, SndName, email,password} = req.body;

    let ur = await user.findOne({email})
    if(ur){
        return res.redirect("/");
    }

    const hashpass = await bcrypt.hash(password,10)

    ur = await user.create({FirstName, SndName,email,password : hashpass});

    const token = jwt.sign({_id: ur._id},"qwertyuiopkjhgfdsa")

    res.cookie("token",token,{
        httpOnly : true,
        expires : new Date(Date.now() + 60*1000)
    });
    res.redirect("/");
})

app.post("/login",async(req,res)=>{
    const {email, password} = req.body;

    let ur = await user.findOne({email})
    if(!ur){
        return res.redirect("/register");
    }

    const isMatch = await bcrypt.compare(password, ur.password);

    if(!isMatch)
        return res.render("login",{email, message : "Incorrect Password"})

    const token = jwt.sign({_id: ur._id},"qwertyuiopkjhgfdsa")

    res.cookie("token",token);
    res.redirect("/");
})

app.get("/logout",(req,res)=>{
    res.cookie("token",null,{
        httpOnly: true,
        expires : new Date(Date.now())
    });
    res.redirect("/");
})

app.listen(5000,()=>{
    console.log("sever ok chusko")
})