const express =require('express');
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
require('dotenv').config()
const cookieParser = require("cookie-parser");

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 3000; 
app.use(cors());
app.use(cookieParser());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7cqr184.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const usersCollection = client.db("homelytix").collection("users");



    app.get("/users", async (req, res) => {
        const result = await usersCollection.find().toArray();
        res.send(result);
      });

      app.post("/users", async(req, res)=>{
        const {username, email, password, photoURL} = req.body;
        const photo = photoURL || "https://icons8.com/icon/492ILERveW8G/male-user"
        const query = { email: email };
      const existingUser = await usersCollection.findOne(query);
      if(existingUser){
        
        res.status(409).json({ error: "User already exists" });
        return;
      }
        const encryptedPassword = await bcrypt.hash(password, 10);
        const result = await usersCollection.insertOne({username, email, password: encryptedPassword, photo});
        res.send(result);
      
      })
      app.post("/signin", async(req, res)=>{
            const {email, password} = req.body;
            try{
                const validUser = await usersCollection.findOne({email});
                if(!validUser){
                    res.status(404).json({ error: "User not found" });
                    return;
                }
                const validPass = bcrypt.compareSync(password, validUser.password);
                if(!validPass){
                    res.status(401).json({ error: "Invalid credentials" });
                    return;
                }
                const token = jwt.sign({id: validUser._id}, process.env.JWT_SECRET);
                const {password: pass, ...rest} = validUser;
                res.cookie("access_token", token, 
                {httpOnly: true}).status(200).json({rest, token});
                
                return;

            
            }
            catch(error){
                console.log(error);
            }
      })
  
      app.post("/google", async(req, res)=>{
        try{
            const user = await usersCollection.findOne({email: req.body.email});
            if(user){
              const token = jwt.sign({id: user._id}, process.env.JWT_SECRET);
                const {password: pass, ...rest} = user;
                res.cookie("access_token", token, 
                {httpOnly: true}).status(200).json({rest, token});
                
                return;
            }
            else{
              const generatePassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
              const hashedPass = await bcrypt.hash(generatePassword, 10);
              const newUser =({username: req.body.username, email: req.body.email, password: hashedPass, avatar: req.body.photo});
              
              const result = await usersCollection.insertOne(newUser);
                console.log(newUser)
                
              const token = jwt.sign({id: newUser._id}, process.env.JWT_SECRET);
              const {password: pass, ...rest} = newUser;
              console.log(rest)
              res.cookie("access_token", token,{httpOnly: true}).status(200).json({rest, token});
              // res.status(200).json({newUser});
              return;
            }
        }
        catch(error){
            console.log(error)
        }
      })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) =>{
    res.send("Homelytix running")
})

app.listen(port, () => {
    console.log(`Homelytix server is running on port ${port}`)
})
// https://icons8.com/icon/492ILERveW8G/male-user