const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;
// middleware
app.use(cors());
app.use(express.json())
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
        app.get('/bids',async(req,res)=>{
            const email = req.query.email;
            const query = {}
            if(email){
                query.buyer_email=email;
            }
            const coursor = bidsCollection.find(query).sort({bid_price: 1})
            const result= await coursor.toArray()
            res.send(result)
        })
        app.post('/bid', async (req, res) => {
            const newBid = req.body;
            const result = await bidsCollection.insertOne(newBid)
            res.send(result)
        })
        app.delete('/bids/:id',async(req,res)=>{
            const id = req.params.id;
            const query ={_id:new ObjectId(id)}
            const result= await bidsCollection.deleteOne(query)
            res.send(result)
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
app.listen(port, () => {
    console.log(`server is running on port ${port}`)
})

