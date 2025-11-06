const express = require('express');
const cors = require('cors');
const admin = require("firebase-admin");
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;


// firebase auth 
// index.js
const decoded = Buffer.from(process.env.FIREBASE_SERVICE_KEY, "base64").toString("utf8");
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// middleware
app.use(cors());
app.use(express.json())
// custom middleware 
const verifyFirebaseToken = async (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).send({ message: "Unatuhraize access" })
    };
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
        return res.status(401).send({ message: "Unathoraize access" })
    }
    // verify token 
    try {
        const userInfo = await admin.auth().verifyIdToken(token);
        req.token_email = userInfo.email;
        next()
    } catch {
        return res.status(401).send({ message: "Unathoraize access" })
    }

}
app.get('/', (req, res) => {
    res.send("Welcome")
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wfr9cox.mongodb.net/?appName=Cluster0`;

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

        // make all api connect with database here 

        const smartDealsDB = client.db("Smart-Deals");
        const smartDealsCollection = smartDealsDB.collection('Products');
        const bidsCollection = smartDealsDB.collection("Bids")

        // products api 
        app.get('/products', async (req, res) => {
            const coursor = smartDealsCollection.find();
            const result = await coursor.toArray();
            res.send(result);
        })
        app.get('/productDetails/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await smartDealsCollection.findOne(query);
            res.send(result)
        })
        app.get('/myProducts',verifyFirebaseToken,async(req,res)=>{
            const email =req.query.email;
            if(req.token_email!==email){
                return res.status(403).send({message:'Forbidden access'})
            }
            const query = {seller_email:email}
            const result= await smartDealsCollection.find(query).toArray();
            res.send(result)
        })
        app.get('/products/recent', async (req, res) => {
            const coursor = smartDealsCollection.find().sort({ price_min: 1 }).limit(6);
            const result = await coursor.toArray();
            res.send(result);
        })
        app.post('/products', async (req, res) => {
            const newProduct = req.body;
            const result = await smartDealsCollection.insertOne(newProduct);
            res.send(result)
        })

        // bid api 
        app.get('/bids/:productId', async (req, res) => {
            const productId = req.params.productId;
            const query = { product: productId }
            const coursor = bidsCollection.find(query).sort({ bid_price: -1 })
            const result = await coursor.toArray()
            res.send(result)
        })
        app.get('/bids', verifyFirebaseToken, async (req, res) => {
            const email = req.query.email;
            const query = {}
            console.log(req.token_email)
            if(req.token_email!==email){
                return res.status(403).send({message:"Forbidden access"})
            }
            if (email) {
                query.buyer_email = email;
            }
            const coursor = bidsCollection.find(query).sort({ bid_price: 1 })
            const result = await coursor.toArray()
            res.send(result)
        })
        app.post('/bid', async (req, res) => {
            const newBid = req.body;
            const result = await bidsCollection.insertOne(newBid)
            res.send(result)
        })
        app.delete('/bids/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await bidsCollection.deleteOne(query)
            res.send(result)
        })
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);
app.listen(port, () => {
    console.log(`server is running on port ${port}`)
})

