const mongoose = require("mongoose");
const { createClient } = require("@supabase/supabase-js");

require("dotenv").config();

// Conditional Supabase initialization
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
  try {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    console.log("✅ Supabase client initialized");
  } catch (error) {
    console.error("❌ Supabase initialization failed:", error.message);
    supabase = null;
  }
} else {
  console.log("⚠️  Supabase not configured - hybrid features disabled");
}

class HybridService {
  /**
   * Supabase WebSocket real-time listener
   */
  static subscribeToVerificationStatus(callback) {
    if (!supabase) {
      console.log("⚠️  Supabase not available - real-time features disabled");
      return null;
    }

    try {
      const channel = supabase
        .channel("verification-status")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "verification_status" },
          (payload) => {
            callback(payload);
          }
        )
        .subscribe((status) => {
          console.log("Realtime subscription:", status);
        });

      return channel;
    } catch (error) {
      console.error("Real-time subscription failed:", error);
      return null;
    }
  }

  /**
   * Health checks for both databases
   */
  static async checkDatabases() {
    let mongoStatus = "unknown";
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.db.admin().ping();
        mongoStatus = "connected";
      } else {
        mongoStatus = "disconnected";
      }
    } catch (err) {
      mongoStatus = "disconnected";
    }

    let supabaseStatus = "unknown";
    if (supabase) {
      try {
        const { data, error } = await supabase.from("verification_status").select("id").limit(1);
        supabaseStatus = error ? "error" : "connected";
      } catch (err) {
        supabaseStatus = "disconnected";
      }
    } else {
      supabaseStatus = "not_configured";
    }

    return { mongo: mongoStatus, supabase: supabaseStatus };
  }

  /**
   * Service availability report (env-based)
   */
  static async serviceAvailability() {
    return {
      mongodb: process.env.MONGO_DB === "enabled",
      supabase: process.env.SUPABASE_DB === "enabled",
    };
  }
}

module.exports = HybridService;
