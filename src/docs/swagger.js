export const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "FineArts Academy Backend APIs",
    version: "1.0.0",
    description: "Complete API documentation for FineArts Academy platform — Admin Auth, User/Trainer/Institute profiles, Classes, Payments, Bookings, Subscriptions, Coupons, Notifications, and Dashboards."
  },

  servers: [
    { url: "http://localhost:5000/api", description: "Local Server" },
    { url: "http://13.204.176.128:5000/api", description: "Production Server (AWS EC2)" }
  ],

  components: {
    securitySchemes: {
      FirebaseAuth: {
        type: "http", scheme: "bearer", bearerFormat: "JWT",
        description: "Paste Firebase ID Token here (for Users, Trainers, Institutes)"
      },
      AdminAuth: {
        type: "http", scheme: "bearer", bearerFormat: "JWT",
        description: "Paste Admin JWT token here (obtained from /admin-auth/login)"
      }
    },
    responses: {
      Unauthorized: {
        description: "Unauthorized — missing or invalid token",
        content: { "application/json": { example: { success: false, message: "Missing or invalid Authorization token" } } }
      },
      NotFound: {
        description: "Resource not found",
        content: { "application/json": { example: { success: false, message: "Resource not found" } } }
      }
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Error occurred" }
        }
      },
      SuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Success" }
        }
      }
    }
  },

  paths: {

    // ─────────────────────────────────────────────
    // 1. ADMIN AUTH
    // ─────────────────────────────────────────────
    "/admin-auth/login": {
      post: {
        tags: ["1. Admin Auth"],
        summary: "Admin Login",
        description: "Logs in the admin using email and password. Returns a JWT token to be used as AdminAuth for all admin operations.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "admin@finearts.com" },
                  password: { type: "string", example: "Admin@123" }
                }
              }
            }
          }
        },
       
      }
    },

    // ─────────────────────────────────────────────
    // 2. AUTH (FIREBASE USERS)
    // ─────────────────────────────────────────────
    "/auth/login": {
      post: {
        tags: ["2. Auth (Firebase Users)"],
        summary: "Login / Register (User)",
        description: "Logs in or auto-registers a user using Firebase ID token. Pass the Firebase token in Authorization header. Role must be USER.",
        security: [{ FirebaseAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["role"],
                properties: { role: { type: "string", enum: ["USER"], example: "USER" } }
              }
            }
          }
        },
       
      }
    },

    "/auth/me": {
      get: {
        tags: ["2. Auth (Firebase Users)"],
        summary: "Get Current Logged-in User",
        description: "Returns the currently authenticated user's account details based on the Firebase token.",
        security: [{ FirebaseAuth: [] }],
       
      }
    },

    // ─────────────────────────────────────────────
    // 3. USER PROFILE
    // ─────────────────────────────────────────────
    "/users/profile": {
      post: {
        tags: ["3. User Profile"],
        summary: "Create / Update Profile",
        description: "Creates or updates the authenticated user's profile.",
        security: [{ FirebaseAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  full_name: { type: "string", example: "Arjun Kumar" },
                  gender: { type: "string", enum: ["MALE", "FEMALE", "OTHER"], example: "MALE" },
                  date_of_birth: { type: "string", format: "date", example: "2000-05-15" },
                  city: { type: "string", example: "Chennai" },
                  state: { type: "string", example: "Tamil Nadu" },
                  country: { type: "string", example: "India" },
                  pincode: { type: "string", example: "600001" }
                }
              }
            }
          }
        },
       
      },
      get: {
        tags: ["3. User Profile"],
        summary: "Get My Profile",
        description: "Retrieves the authenticated user's complete profile.",
        security: [{ FirebaseAuth: [] }],
       
      }
    },

    // ─────────────────────────────────────────────
    // 4. TRAINER
    // ─────────────────────────────────────────────
    "/trainers/login": {
      post: {
        tags: ["4. Trainer"],
        summary: "Trainer Login (auto-creates account on first login)",
        description: "Logs in a trainer using Firebase token. Auto-creates account if not exists.",
        security: [{ FirebaseAuth: [] }],
        
      }
    },

    "/trainers/complete-profile": {
      put: {
        tags: ["4. Trainer"],
        summary: "Trainer Complete Profile",
        description: "Allows a trainer to fill in their full profile including specializations.",
        security: [{ FirebaseAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  full_name: { type: "string", example: "Priya Sharma" },
                  bio: { type: "string", example: "Classical Bharatanatyam dancer with 10 years experience" },
                  experience_years: { type: "integer", example: 10 },
                  email: { type: "string", example: "priya@example.com" },
                  phone_number: { type: "string", example: "+919876543210" },
                  profile_image: { type: "string", example: "https://example.com/priya.jpg" },
                  certificate_url: { type: "string", example: "https://example.com/cert.pdf" },
                  specializations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category_id: { type: "integer" },
                        subcategory_id: { type: "integer" }
                      }
                    },
                    example: [{ category_id: 1, subcategory_id: 2 }, { category_id: 3 }]
                  }
                }
              }
            }
          }
        },
      }
    },

    "/trainers/me/profile": {
      get: {
        tags: ["4. Trainer"],
        summary: "Get My Trainer Profile",
        description: "Fetches the authenticated trainer's own complete profile.",
        security: [{ FirebaseAuth: [] }],
       
      }
    },

    "/trainers/{id}": {
      get: {
        tags: ["4. Trainer"],
        summary: "Get Trainer Public Profile (by ID)",
        description: "Public endpoint — returns a trainer's profile by numeric ID. No authentication required.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
      }
    },

    "/trainers/me/qr": {
      put: {
        tags: ["4. Trainer"],
        summary: "Update Trainer QR Code",
        description: "Allows a trainer to update their UPI payment QR code image and UPI ID.",
        security: [{ FirebaseAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  qr_image_url: { type: "string", example: "https://example.com/trainer-qr.png" },
                  upi_id: { type: "string", example: "priya@upi" }
                }
              }
            }
          }
        },
        
      }
    },

    "/classes/trainer/apply-institute": {
      post: {
        tags: ["4. Trainer"],
        summary: "Trainer Apply to Institute",
        description: "Allows a trainer to apply to join an institute.",
        security: [{ FirebaseAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { institute_id: { type: "integer", example: 1 } }
              }
            }
          }
        },
        
      }
    },

    // ─────────────────────────────────────────────
    // 5. INSTITUTE
    // ─────────────────────────────────────────────
    "/institutes/login": {
      post: {
        tags: ["5. Institute"],
        summary: "Institute Login (auto-creates account on first login)",
        description: "Logs in an institute using Firebase token. Auto-creates account if not exists.",
        security: [{ FirebaseAuth: [] }],
       
       
      }
    },

    "/institutes/complete-profile": {
      put: {
        tags: ["5. Institute"],
        summary: "Institute Complete Profile",
        description: "Fills in the institute's full profile including categories offered.",
        security: [{ FirebaseAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Kalai Nilayam Fine Arts" },
                  description: { type: "string", example: "Premier fine arts institute in Chennai" },
                  email: { type: "string", example: "info@kalainilayam.com" },
                  phone_number: { type: "string", example: "+914412345678" },
                  address: { type: "string", example: "12 Anna Salai" },
                  city: { type: "string", example: "Chennai" },
                  state: { type: "string", example: "Tamil Nadu" },
                  pincode: { type: "string", example: "600002" },
                  categories: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category_id: { type: "integer" },
                        subcategory_id: { type: "integer" }
                      }
                    },
                    example: [{ category_id: 1 }, { category_id: 2, subcategory_id: 3 }]
                  }
                }
              }
            }
          }
        },
       
      }
    },

    "/institutes/profile": {
      get: {
        tags: ["5. Institute"],
        summary: "Get Institute Profile",
        description: "Retrieves the authenticated institute's own profile details.",
        security: [{ FirebaseAuth: [] }],
       
      }
    },

    "/institutes": {
      get: {
        tags: ["5. Institute"],
        summary: "List All Institutes (Public)",
        description: "Public endpoint — lists all approved institutes with optional city filter.",
        parameters: [
          { name: "city", in: "query", schema: { type: "string", example: "Chennai" } },
          { name: "page", in: "query", schema: { type: "integer", example: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", example: 10 } }
        ],
        
            
          
        
      }
    },

    "/institutes/{id}/trainers": {
      get: {
        tags: ["5. Institute"],
        summary: "Get Institute Trainers (Public)",
        description: "Returns all trainers associated with a specific institute.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        
      }
    },

    "/classes/institute/add-trainer": {
      post: {
        tags: ["5. Institute"],
        summary: "Institute Add Trainer Directly",
        description: "Institutes can directly add a trainer to their roster.",
        security: [{ FirebaseAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  full_name: { type: "string", example: "Ravi Shankar" },
                  phone_number: { type: "string", example: "+919123456789" },
                  email: { type: "string", example: "ravi@example.com" },
                  bio: { type: "string", example: "Carnatic music teacher" },
                  experience_years: { type: "integer", example: 8 },
                  category_id: { type: "integer", example: 1 }
                }
              }
            }
          }
        },
        
      }
    },

    "/classes/institute/trainer-applications": {
      get: {
        tags: ["5. Institute"],
        summary: "Institute View Trainer Applications",
        description: "Returns all trainer applications received by the institute.",
        security: [{ FirebaseAuth: [] }],
       
      }
    },

    "/classes/institute/trainer-applications/{id}": {
      patch: {
        tags: ["5. Institute"],
        summary: "Accept / Reject Trainer Application",
        description: "Allows an institute to accept or reject a pending trainer application.",
        security: [{ FirebaseAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { action: { type: "string", enum: ["accept", "reject"], example: "accept" } }
              }
            }
          }
        },
        
      }
    },

    "/institutes/trainers/{id}/approval": {
      put: {
        tags: ["5. Institute"],
        summary: "Institute Update Trainer Approval Status",
        description: "Updates the approval status of a trainer within the institute.",
        security: [{ FirebaseAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["APPROVED", "REJECTED"], example: "APPROVED" },
                  reason: { type: "string", example: "" }
                }
              }
            }
          }
        },
       
      }
    },

    // ─────────────────────────────────────────────
    // 6. CATEGORIES & SUBCATEGORIES
    // ─────────────────────────────────────────────
    "/categories": {
      get: {
        tags: ["6. Categories & Subcategories"],
        summary: "List All Categories (Public)",
        description: "Returns all available art categories.",
      
        
      },
      post: {
        tags: ["6. Categories & Subcategories"],
        summary: "Create Category (Admin)",
        description: "Admin only — creates a new art category.",
        security: [{ AdminAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Bharatanatyam" },
                  description: { type: "string", example: "Classical Indian dance form" },
                  image_url: { type: "string", example: "https://example.com/bharatanatyam.jpg" }
                }
              }
            }
          }
        },
       
      }
    },

    "/categories/{id}": {
      get: {
        tags: ["6. Categories & Subcategories"],
        summary: "Get Category by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
       
      },
      put: {
        tags: ["6. Categories & Subcategories"],
        summary: "Update Category (Admin)",
        security: [{ AdminAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Bharatanatyam" },
                  description: { type: "string", example: "Updated description" }
                }
              }
            }
          }
        },
       
      },
      delete: {
        tags: ["6. Categories & Subcategories"],
        summary: "Delete Category (Admin)",
        security: [{ AdminAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        
      }
    },

    "/subcategories": {
      get: {
        tags: ["6. Categories & Subcategories"],
        summary: "List All Subcategories (Public)",
       
        
      },
      post: {
        tags: ["6. Categories & Subcategories"],
        summary: "Create Subcategory (Admin)",
        security: [{ AdminAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Beginner Bharatanatyam" },
                  category_id: { type: "integer", example: 1 }
                }
              }
            }
          }
        },
       
      }
    },

    "/subcategories/category/{id}": {
      get: {
        tags: ["6. Categories & Subcategories"],
        summary: "Get Subcategories by Category",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
       
      }
    },

    // ─────────────────────────────────────────────
    // 7. CLASSES
    // ─────────────────────────────────────────────
    "/classes": {
      get: {
        tags: ["7. Classes"],
        summary: "List Classes (Public)",
        description: "Returns all approved classes with optional filters.",
        parameters: [
          { name: "category_id", in: "query", schema: { type: "integer", example: 1 } },
          { name: "mode", in: "query", schema: { type: "string", enum: ["ONLINE", "OFFLINE"] } },
          { name: "level", in: "query", schema: { type: "string", enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"] } },
          { name: "page", in: "query", schema: { type: "integer", example: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", example: 12 } }
        ],
  
        
      }
    },

    "/classes/{id}": {
      get: {
        tags: ["7. Classes"],
        summary: "Get Class by ID (Public)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
       
      }
    },

    "/classes/institute/create": {
      post: {
        tags: ["7. Classes"],
        summary: "Institute Create Class",
        description: "Institute creates a class. Sent for admin approval before going live.",
        security: [{ FirebaseAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", example: "Bharatanatyam for Beginners" },
                  description: { type: "string", example: "Learn the basics of Bharatanatyam" },
                  trainer_id: { type: "integer", example: 1 },
                  category_id: { type: "integer", example: 1 },
                  subcategory_id: { type: "integer", example: 2 },
                  price: { type: "number", example: 1500 },
                  duration: { type: "integer", example: 60 },
                  level: { type: "string", enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"], example: "BEGINNER" },
                  mode: { type: "string", enum: ["ONLINE", "OFFLINE"], example: "OFFLINE" },
                  max_students: { type: "integer", example: 20 },
                  schedule: {
                    type: "object",
                    properties: {
                      start_date: { type: "string", example: "2026-06-01" },
                      end_date: { type: "string", example: "2026-08-31" },
                      start_time: { type: "string", example: "09:00" },
                      end_time: { type: "string", example: "10:00" },
                      days_of_week: { type: "string", example: "MON,WED,FRI" }
                    }
                  }
                }
              }
            }
          }
        },
        
      }
    },

    "/classes/trainer/create": {
      post: {
        tags: ["7. Classes"],
        summary: "Trainer Create Class",
        description: "Trainer creates their own independent class.",
        security: [{ FirebaseAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", example: "Online Carnatic Music" },
                  description: { type: "string", example: "Learn Carnatic music from scratch" },
                  category_id: { type: "integer", example: 2 },
                  price: { type: "number", example: 800 },
                  duration: { type: "integer", example: 45 },
                  level: { type: "string", enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"], example: "BEGINNER" },
                  mode: { type: "string", enum: ["ONLINE", "OFFLINE"], example: "ONLINE" },
                  max_students: { type: "integer", example: 10 },
                  meeting_link: { type: "string", example: "https://meet.google.com/abc-xyz" }
                }
              }
            }
          }
        },
       
      }
    },

    "/classes/institute/{id}": {
      put: {
        tags: ["7. Classes"],
        summary: "Update Class (Institute)",
        security: [{ FirebaseAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", example: "Advanced Bharatanatyam" },
                  price: { type: "number", example: 2000 },
                  level: { type: "string", example: "ADVANCED" },
                  max_students: { type: "integer", example: 15 }
                }
              }
            }
          }
        },
       
      }
    },

    "/classes/trainer/{id}": {
      delete: {
        tags: ["7. Classes"],
        summary: "Delete Class (Trainer)",
        security: [{ FirebaseAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
       
      }
    },

    // ─────────────────────────────────────────────
    // 8. PAYMENTS (QR FLOW)
    // ─────────────────────────────────────────────
    "/payments/qr/{class_id}": {
      get: {
        tags: ["8. Payments (QR Flow)"],
        summary: "Get QR Code + Amount for Class (Public)",
        description: "Returns the QR code image, UPI ID, and payable amount for a specific class.",
        parameters: [{ name: "class_id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
       
      }
    },

    "/payments/qr-settings": {
      get: {
        tags: ["8. Payments (QR Flow)"],
        summary: "Get Platform QR Settings (Public)",
       
      }
    },

    "/payments/submit": {
      post: {
        tags: ["8. Payments (QR Flow)"],
        summary: "Submit Payment (User — after scanning QR)",
        description: "User submits payment proof after completing the bank transfer via QR scan.",
        security: [{ FirebaseAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  class_id: { type: "integer", example: 1 },
                  booking_type: { type: "string", enum: ["CLASS"], example: "CLASS" },
                  amount: { type: "number", example: 1500 },
                  utr_number: { type: "string", example: "UTR123456789" },
                  payment_screenshot: { type: "string", example: "https://example.com/screenshot.jpg" },
                  start_date: { type: "string", format: "date", example: "2026-06-01" },
                  end_date: { type: "string", format: "date", example: "2026-08-31" },
                  coupon_id: { type: "integer", nullable: true, example: null },
                  discount_amount: { type: "number", example: 0 },
                  points_redeemed: { type: "integer", example: 0 },
                  points_discount: { type: "number", example: 0 }
                }
              },
              examples: {
                withoutCoupon: {
                  summary: "Submit without coupon",
                  value: { class_id: 1, booking_type: "CLASS", amount: 1500, utr_number: "UTR123456789", payment_screenshot: "https://example.com/screenshot.jpg", start_date: "2026-06-01", end_date: "2026-08-31", coupon_id: null, discount_amount: 0, points_redeemed: 0, points_discount: 0 }
                },
                withCoupon: {
                  summary: "Submit with coupon + points",
                  value: { class_id: 1, booking_type: "CLASS", amount: 1500, utr_number: "UTR987654321", coupon_id: 1, discount_amount: 150, points_redeemed: 50, points_discount: 5 }
                }
              }
            }
          }
        },
       
      }
    },

    "/payments/my": {
      get: {
        tags: ["8. Payments (QR Flow)"],
        summary: "Get My Payments",
        security: [{ FirebaseAuth: [] }],
        
      }
    },

    "/payments/pending": {
      get: {
        tags: ["8. Payments (QR Flow)"],
        summary: "Get Pending Payments (Admin / Institute)",
        security: [{ FirebaseAuth: [] }],
       
      }
    },

    "/payments/{id}/verify": {
      patch: {
        tags: ["8. Payments (QR Flow)"],
        summary: "Verify Payment (Admin)",
        security: [{ AdminAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        
      }
    },

    "/payments/{id}/reject": {
      patch: {
        tags: ["8. Payments (QR Flow)"],
        summary: "Reject Payment (Admin)",
        security: [{ AdminAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", properties: { reason: { type: "string", example: "UTR number not found in bank records" } } }
            }
          }
        },
        
      }
    },

    // ─────────────────────────────────────────────
    // 9. BOOKINGS
    // ─────────────────────────────────────────────
    "/bookings": {
      post: {
        tags: ["9. Bookings"],
        summary: "Create Booking",
        security: [{ FirebaseAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  booking_type: { type: "string", enum: ["CLASS"], example: "CLASS" },
                  class_id: { type: "integer", example: 1 },
                  amount: { type: "number", example: 1500 },
                  start_date: { type: "string", format: "date", example: "2026-06-01" },
                  end_date: { type: "string", format: "date", example: "2026-08-31" }
                }
              }
            }
          }
        },
       
      }
    },

    "/bookings/my": {
      get: {
        tags: ["9. Bookings"],
        summary: "Get My Bookings",
        security: [{ FirebaseAuth: [] }],
       
      }
    },

    "/bookings/{id}": {
      get: {
        tags: ["9. Bookings"],
        summary: "Get Booking by ID",
        security: [{ FirebaseAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
       
      }
    },

    "/bookings/{id}/cancel": {
      patch: {
        tags: ["9. Bookings"],
        summary: "Cancel Booking",
        security: [{ FirebaseAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
       
      }
    },

    "/bookings/{id}/confirm": {
      patch: {
        tags: ["9. Bookings"],
        summary: "Confirm Booking",
        security: [{ FirebaseAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        
      }
    },

    "/bookings/{id}/complete": {
      patch: {
        tags: ["9. Bookings"],
        summary: "Complete Booking",
        security: [{ FirebaseAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
       
      }
    },

    "/bookings/class/{id}": {
      get: {
        tags: ["9. Bookings"],
        summary: "Get Bookings by Class",
        security: [{ FirebaseAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
       
      }
    },

    "/bookings/trainer/{id}": {
      get: {
        tags: ["9. Bookings"],
        summary: "Get Bookings by Trainer",
        security: [{ FirebaseAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
      
      }
    },

    "/bookings/institute/{id}": {
      get: {
        tags: ["9. Bookings"],
        summary: "Get Bookings by Institute",
        security: [{ FirebaseAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        
      }
    },

   

    // ─────────────────────────────────────────────
    // 11. COUPONS & REWARDS
    // ─────────────────────────────────────────────
    "/coupons": {
      post: {
        tags: ["11. Coupons & Rewards"],
        summary: "Create Coupon (Admin)",
        security: [{ AdminAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  code: { type: "string", example: "WELCOME20" },
                  description: { type: "string", example: "20% off on first booking" },
                  discount_type: { type: "string", enum: ["PERCENT", "FLAT"], example: "PERCENT" },
                  discount_value: { type: "number", example: 20 },
                  min_order_amount: { type: "number", example: 500 },
                  max_discount_amount: { type: "number", example: 300 },
                  usage_limit: { type: "integer", example: 100 },
                  valid_until: { type: "string", format: "date-time", example: "2026-12-31T23:59:59" }
                }
              },
              examples: {
                percent: { summary: "Percent Coupon", value: { code: "WELCOME20", description: "20% off on first booking", discount_type: "PERCENT", discount_value: 20, min_order_amount: 500, max_discount_amount: 300, usage_limit: 100, valid_until: "2026-12-31T23:59:59" } },
                flat: { summary: "Flat Coupon", value: { code: "FLAT200", description: "Flat Rs.200 off", discount_type: "FLAT", discount_value: 200, min_order_amount: 1000, usage_limit: 50 } }
              }
            }
          }
        },
       
      },
      get: {
        tags: ["11. Coupons & Rewards"],
        summary: "List All Coupons (Admin)",
        security: [{ AdminAuth: [] }],
        
      }
    },

    "/coupons/{id}/toggle": {
      patch: {
        tags: ["11. Coupons & Rewards"],
        summary: "Toggle Coupon Active (Admin)",
        security: [{ AdminAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", properties: { is_active: { type: "boolean", example: false } } }
            }
          }
        },
      
      }
    },

    "/coupons/validate": {
      post: {
        tags: ["11. Coupons & Rewards"],
        summary: "Validate Coupon (User — before payment)",
        description: "Call this before submitting payment to get the discount amount.",
        security: [{ FirebaseAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  code: { type: "string", example: "WELCOME20" },
                  amount: { type: "number", example: 1500 }
                }
              }
            }
          }
        },
       
      }
    },

    "/coupons/rewards/my": {
      get: {
        tags: ["11. Coupons & Rewards"],
        summary: "Get My Rewards & Points",
        security: [{ FirebaseAuth: [] }],
       
      }
    },

    "/coupons/rewards/redeem": {
      post: {
        tags: ["11. Coupons & Rewards"],
        summary: "Redeem Points for Discount",
        security: [{ FirebaseAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", properties: { points: { type: "integer", example: 50 } } }
            }
          }
        },
       
      }
    },

    // ─────────────────────────────────────────────
    // 12. ADMIN PANEL
    // ─────────────────────────────────────────────
    "/admin/institutes": {
      get: {
        tags: ["12. Admin Panel"],
        summary: "Get All Institutes",
        security: [{ AdminAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"], example: "PENDING" } }
        ],
        
      }
    },

    "/admin/institutes/pending": {
      get: {
        tags: ["12. Admin Panel"],
        summary: "Get Pending Institutes",
        security: [{ AdminAuth: [] }],
       
      }
    },

    "/admin/institutes/{id}/approve": {
      patch: {
        tags: ["12. Admin Panel"],
        summary: "Approve Institute",
        security: [{ AdminAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
       
      }
    },

    "/admin/institutes/{id}/reject": {
      patch: {
        tags: ["12. Admin Panel"],
        summary: "Reject Institute",
        security: [{ AdminAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", properties: { reason: { type: "string", example: "Incomplete documentation provided" } } }
            }
          }
        },
       
      }
    },

    "/admin/trainers": {
      get: {
        tags: ["12. Admin Panel"],
        summary: "Get All Trainers",
        security: [{ AdminAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"], example: "PENDING" } }
        ],
       
      }
    },

    "/admin/trainers/pending": {
      get: {
        tags: ["12. Admin Panel"],
        summary: "Get Pending Trainers",
        security: [{ AdminAuth: [] }],
       
      }
    },

    "/admin/trainers/{id}/approve": {
      patch: {
        tags: ["12. Admin Panel"],
        summary: "Approve Trainer",
        security: [{ AdminAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
      
      }
    },

    "/admin/trainers/{id}/reject": {
      patch: {
        tags: ["12. Admin Panel"],
        summary: "Reject Trainer",
        security: [{ AdminAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", properties: { reason: { type: "string", example: "Certificate not verified" } } }
            }
          }
        },
       
      }
    },

    "/admin/classes/pending": {
      get: {
        tags: ["12. Admin Panel"],
        summary: "Get Pending Classes",
        security: [{ AdminAuth: [] }],
        
      }
    },

    "/admin/classes/{id}/approve": {
      patch: {
        tags: ["12. Admin Panel"],
        summary: "Approve Class",
        security: [{ AdminAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
       
      }
    },

    "/admin/classes/{id}/reject": {
      patch: {
        tags: ["12. Admin Panel"],
        summary: "Reject Class",
        security: [{ AdminAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", properties: { reason: { type: "string", example: "Class content does not meet guidelines" } } }
            }
          }
        },
        
      }
    },

    // ─────────────────────────────────────────────
    // 13. DASHBOARD
    // ─────────────────────────────────────────────
    "/dashboard/user": {
      get: {
        tags: ["13. Dashboard"],
        summary: "User Dashboard",
        security: [{ FirebaseAuth: [] }],
        
      }
    },

    "/dashboard/trainer": {
      get: {
        tags: ["13. Dashboard"],
        summary: "Trainer Dashboard",
        security: [{ FirebaseAuth: [] }],
        
      }
    },

    "/dashboard/institute": {
      get: {
        tags: ["13. Dashboard"],
        summary: "Institute Dashboard",
        security: [{ FirebaseAuth: [] }],
       
      }
    },

    "/dashboard/admin": {
      get: {
        tags: ["13. Dashboard"],
        summary: "Admin Dashboard",
        security: [{ AdminAuth: [] }],
        
      }
    },

    "/dashboard/admin/revenue": {
      get: {
        tags: ["13. Dashboard"],
        summary: "Admin Revenue Report",
        security: [{ AdminAuth: [] }],
        
      }
    },

    "/dashboard/admin/bookings-summary": {
      get: {
        tags: ["13. Dashboard"],
        summary: "Admin Bookings Summary",
        security: [{ AdminAuth: [] }],
       
      }
    },

    "/dashboard/admin/users-summary": {
      get: {
        tags: ["13. Dashboard"],
        summary: "Admin Users Summary",
        security: [{ AdminAuth: [] }],
      
      }
    },

    // ─────────────────────────────────────────────
    // 14. NOTIFICATIONS
    // ─────────────────────────────────────────────
    "/notifications/my": {
      get: {
        tags: ["14. Notifications"],
        summary: "Get My Notifications",
        security: [{ FirebaseAuth: [] }],
       
      }
    },

    "/notifications/{id}/read": {
      patch: {
        tags: ["14. Notifications"],
        summary: "Mark Notification as Read",
        security: [{ FirebaseAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
       
      }
    },

    "/notifications/read-all": {
      patch: {
        tags: ["14. Notifications"],
        summary: "Mark All Notifications as Read",
        security: [{ FirebaseAuth: [] }],
       
      }
    },

    "/notifications/send": {
      post: {
        tags: ["14. Notifications"],
        summary: "Send Notification",
        description: "Sends a notification to a specific account by their account ID.",
        security: [{ FirebaseAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", example: "Class Reminder" },
                  message: { type: "string", example: "Your Bharatanatyam class starts in 1 hour" },
                  target_account_id: { type: "integer", example: 5 }
                }
              }
            }
          }
        },
       
      }
    }

  }
};