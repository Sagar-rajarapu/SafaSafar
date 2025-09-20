const express = require("express");
const Tourist = require("../models/tourist");
const QRCode = require("qrcode");
const multer = require("multer");
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

require("dotenv").config();

const router = express.Router();

// ✅ Supabase client (conditional initialization)
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
} else {
  console.log("⚠️  Supabase not configured - file uploads will use local storage");
}

// ✅ Multer temp storage
const upload = multer({ dest: "uploads/" });

/**
 * 1. Profile management with MongoDB
 */
router.post("/profile", async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    let tourist = await Tourist.findOne({ email });
    if (!tourist) {
      tourist = new Tourist({ name, email, phone });
    } else {
      tourist.name = name;
      tourist.phone = phone;
    }

    await tourist.save();
    res.json({ success: true, tourist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 2. Digital ID generation (Hyperledger stub)
 */
router.post("/:id/digital-id", async (req, res) => {
  try {
    const tourist = await Tourist.findById(req.params.id);
    if (!tourist) return res.status(404).json({ error: "Tourist not found" });

    // 🔹 Replace with Hyperledger Fabric integration
    const fakeDigitalId = `DID-${Date.now()}`;
    tourist.digitalId = fakeDigitalId;

    await tourist.save();
    res.json({ success: true, digitalId: fakeDigitalId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 3. Document upload with fallback storage
 */
router.post("/:id/upload", upload.single("doc"), async (req, res) => {
  try {
    const tourist = await Tourist.findById(req.params.id);
    if (!tourist) return res.status(404).json({ error: "Tourist not found" });

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = `${tourist._id}/${Date.now()}_${req.file.originalname}`;
    let storageResult;

    if (supabase) {
      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from("tourist-documents")
        .upload(filePath, fs.readFileSync(req.file.path), {
          contentType: req.file.mimetype,
        });

      if (error) throw error;
      storageResult = { type: "supabase", path: filePath, data };
    } else {
      // Local storage fallback
      const localPath = `uploads/${filePath}`;
      const localDir = `uploads/${tourist._id}`;
      
      // Ensure directory exists
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      
      // Move file to permanent location
      fs.renameSync(req.file.path, localPath);
      storageResult = { type: "local", path: localPath };
    }

    // Store document reference
    tourist.documents.push({
      type: req.body.documentType || "general",
      filename: req.file.originalname,
      path: storageResult.path,
      storageType: storageResult.type,
      uploadedAt: new Date()
    });
    
    await tourist.save();

    res.json({ 
      success: true, 
      filePath: storageResult.path,
      storageType: storageResult.type,
      message: `File uploaded to ${storageResult.type} storage`
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 4. QR code generation
 */
router.post("/:id/qrcode", async (req, res) => {
  try {
    const tourist = await Tourist.findById(req.params.id);
    if (!tourist) return res.status(404).json({ error: "Tourist not found" });

    const verifyUrl = `${process.env.VERIFY_URL_BASE}/tourist/${tourist._id}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl);

    tourist.qrCode = qrCodeDataUrl;
    await tourist.save();

    res.json({ success: true, qrCode: qrCodeDataUrl, verifyUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 5. Dashboard - Service Status
 */
router.get("/dashboard/status", (req, res) => {
  res.json({
    mongodb: process.env.MONGODB_URI ? "configured" : "missing",
    supabase: process.env.SUPABASE_URL ? "configured" : "missing",
    hyperledger: process.env.FABRIC_NETWORK_CONFIG ? "stubbed" : "missing",
    verifyUrl: process.env.VERIFY_URL_BASE || "not set",
  });
});

module.exports = router;
