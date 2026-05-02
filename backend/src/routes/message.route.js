import express from "express";

const router= express.Router();

router.get("/send",(req,res)=>
{
    res.send("Send messages endpoint");
});

router.get("/recieve",(req,res)=>
{
    res.send("recive message endpoint");
});



export default router;
