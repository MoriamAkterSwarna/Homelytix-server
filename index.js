const express =require('express');
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
require('dotenv').config()
const bcrypt = require('bcryptjs');
const port = process.env.PORT || 3000; 
app.use(cors());
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
        const {username, email, password} = req.body;
        const query = { email: email };
      const existingUser = await usersCollection.findOne(query);
      if(existingUser){
        res.send("User already exists")
        return;
      }
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await usersCollection.insertOne({username, email, password: hashedPassword});
        res.send(result);
      
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