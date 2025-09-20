const mongoose = require("mongoose");

const TouristSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters"],
    maxlength: [50, "Name cannot exceed 50 characters"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s-()]+$/, "Please enter a valid phone number"]
  },
  digitalId: {
    type: String,
    sparse: true
  },
  documents: [{
    type: { type: String, enum: ["passport", "visa", "id_proof", "address_proof", "general"] },
    filename: String,
    path: String,
    storageType: { type: String, enum: ["local", "supabase"] },
    uploadedAt: { type: Date, default: Date.now }
  }],
  qrCode: String,
  verificationLevel: {
    type: Number,
    default: 0,
    min: 0,
    max: 3
  },
  kycStatus: {
    aadhaar: {
      verified: { type: Boolean, default: false },
      number: { type: String, select: false },
      verifiedAt: Date
    },
    digilocker: {
      verified: { type: Boolean, default: false },
      linkedAt: Date
    },
    pan: {
      verified: { type: Boolean, default: false },
      number: { type: String, select: false },
      verifiedAt: Date
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      delete ret.kycStatus.aadhaar.number;
      delete ret.kycStatus.pan.number;
      return ret;
    }
  }
});

// Index for performance
TouristSchema.index({ email: 1 }, { unique: true });
TouristSchema.index({ digitalId: 1 }, { unique: true, sparse: true });
TouristSchema.index({ verificationLevel: 1 });

// Static method to find by email
TouristSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find by digital ID
TouristSchema.statics.findByDigitalId = function(digitalId) {
  return this.findOne({ digitalId });
};

module.exports = mongoose.model("Tourist", TouristSchema);
