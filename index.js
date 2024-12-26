const { MongoClient } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { ObjectId } = require("mongodb");
const port = process.env.PORT || 8000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hh1ak.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  tls: true,
  serverSelectionTimeoutMS: 3000,
  autoSelectFamily: false,
});

let servicesCollection;

async function run() {
  try {
    await client.connect();
    const database = client.db("ServiceScope");
    servicesCollection = database.collection("services ");

    const collections = await database.listCollections().toArray();
    console.log("Collections in database:", collections);

    console.log("Connected to the services collection in MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
  }
}

run().catch(console.dir);

app.get("/services", async (req, res) => {
  try {
    const services = await servicesCollection.find({}).limit(6).toArray();
    console.log("Fetched services:", services);

    if (services.length === 0) {
      console.warn("No services found in the collection");
    }

    res.status(200).json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).send("Failed to fetch services", error);
  }
});

app.get("/service/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log("Received ID:", id);

    const service = await servicesCollection.findOne({ _id: new ObjectId(id) });
    console.log("Service fetched:", service);

    if (!service) {
      return res.status(404).send("Service not found");
    }
    
    res.status(200).json(service);
  } catch (error) {
    console.error("Error fetching service by ID:", error);
    res.status(500).send("Failed to fetch service");
  }
});

app.post("/newServices", async (req, res) => {
  try {
    const service = req.body;
    console.log("Received data:", service);

    if (!service.serviceTitle || !service.price || !service.userEmail) {
      return res.status(400).send("Missing required fields");
    }

    const result1 = await servicesCollection.insertOne(service);
    console.log("Service added to 'services' collection:", result1);

    const newServicesCollection = client.db("ServiceScope").collection("newServices");
    const result2 = await newServicesCollection.insertOne(service);
    console.log("Service added to 'newServices' collection:", result2);

    res.status(201).json({
      message: "Service added successfully to both collections",
      serviceId: result1.insertedId,
    });
  } catch (error) {
    console.error("Error adding service:", error);
    res.status(500).send("Failed to add service");
  }
});

app.post("/services", async (req, res) => {
  try {
    const service = req.body;
    console.log("Received data:", service);

    if (!service.serviceTitle || !service.price || !service.userEmail) {
      return res.status(400).send("Missing required fields");
    }

    const result1 = await servicesCollection.insertOne(service);
    console.log("Service added to 'services' collection:", result1);

    const newServicesCollection = client.db("ServiceScope").collection("services ");
    const result2 = await newServicesCollection.insertOne(service); 
    console.log("Service added to 'newServices' collection:", result2);

    res.status(201).json({
      message: "Service added successfully to both collections",
      serviceId: result1.insertedId,
    });
  } catch (error) {
    console.error("Error adding service:", error);
    res.status(500).send("Failed to add service");
  }
});

app.get("/userServices", async (req, res) => {
  try {
    const { userEmail } = req.query;
    if (!userEmail) {
      return res.status(400).send("User email is required to fetch services.");
    }

    const newServicesCollection = client.db("ServiceScope").collection("newServices");
    const services = await newServicesCollection.find({ userEmail }).toArray();

    if (services.length === 0) {
      return res.status(404).send("No services found for this user.");
    }

    res.status(200).json(services);
  } catch (error) {
    console.error("Error fetching user services:", error);
    res.status(500).send("Failed to fetch user services.");
  }
});


// Root endpoint
app.get("/", (req, res) => {
  res.send("Hello World");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
