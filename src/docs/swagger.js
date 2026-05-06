export const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "FineArts Academy Backend APIs",
    version: "1.0.0",
    description: "Complete API documentation for FineArts Academy platform — Admin Auth, User/Trainer/Institute profiles, Classes, Payments, Bookings, Subscriptions, Coupons, Notifications, and Dashboards."
  },

  servers: [
    {
      url: "http://localhost:5000/api",
      description: "Local Server"
    },
    {
      url: "http://13.204.176.128:5000/api",
      description: "Production Server (AWS EC2)"
    }
  ],

  components: {
    securitySchemes: {
      FirebaseAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Paste Firebase ID Token here (for Users, Trainers, Institutes)"
      },
      AdminAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Paste Admin JWT token here (obtained from /admin-auth/login)"
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
                properties: {
                  role: { type: "string", enum: ["USER"], example: "USER" }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Login successful",
                  data: {
                    id: 1,
                    firebase_uid: "abc123xyz",
                    email: "user@gmail.com",
                    phone_number: null,
                    role: "USER",
                    is_active: true,
                    is_verified: true,
                    created_at: "2026-05-01T10:00:00Z"
                  }
                }
              }
            }
          },
          401: {
            description: "Invalid Firebase token",
            content: {
              "application/json": {
                example: { success: false, message: "Invalid or expired Firebase token" }
              }
            }
          }
        }
      }
    },

    "/auth/me": {
      get: {
        tags: ["2. Auth (Firebase Users)"],
        summary: "Get Current Logged-in User",
        description: "Returns the currently authenticated user's account details based on the Firebase token.",
        security: [{ FirebaseAuth: [] }],
        responses: {
          200: {
            description: "User fetched successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Current user fetched successfully",
                  data: {
                    id: 1,
                    firebase_uid: "abc123xyz",
                    email: "user@gmail.com",
                    role: "USER",
                    is_active: true
                  }
                }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                example: { success: false, message: "Account not found. Please login first." }
              }
            }
          }
        }
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
        security: [{ FirebaseAuth: [] }],  // ✅ FIX: was already present on POST
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
        responses: {
          200: {
            description: "Profile created or updated",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Profile updated",
                  profile: {
                    id: 5,
                    full_name: "Arjun Kumar",
                    gender: "MALE",
                    date_of_birth: "2000-05-15",
                    city: "Chennai",
                    state: "Tamil Nadu",
                    country: "India",
                    pincode: "600001"
                  }
                }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                example: { success: false, message: "Missing Authorization token" }
              }
            }
          }
        }
      },
      get: {
        tags: ["3. User Profile"],
        summary: "Get My Profile",
        description: "Retrieves the authenticated user's complete profile.",
        security: [{ FirebaseAuth: [] }],  // ✅ FIX: was MISSING — this caused the 401 bug
        responses: {
          200: {
            description: "Profile fetched",
            content: {
              "application/json": {
                example: {
                  success: true,
                  profile: {
                    id: 5,
                    full_name: "Arjun Kumar",
                    gender: "MALE",
                    city: "Chennai",
                    state: "Tamil Nadu",
                    country: "India",
                    pincode: "600001"
                  }
                }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                example: { success: false, message: "Missing Authorization token" }
              }
            }
          }
        }
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
        responses: {
          200: {
            description: "Trainer logged in",
            content: {
              "application/json": {
                example: {
                  message: "Login success",
                  account: { id: "3", firebase_uid: "trainerUID...", email: "trainer@gmail.com", is_active: true },
                  role: { role: "TRAINER", approval_status: "PENDING" }
                }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                example: { success: false, message: "Missing Authorization token" }
              }
            }
          }
        }
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
        responses: {
          200: {
            description: "Profile completed",
            content: {
              "application/json": {
                example: {
                  message: "Profile updated",
                  trainer: { id: "3", full_name: "Priya Sharma", bio: "Classical Bharatanatyam dancer...", experience_years: 10, approval_status: "PENDING" }
                }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                example: { success: false, message: "Missing Authorization token" }
              }
            }
          }
        }
      }
    },

    "/trainers/me/profile": {
      get: {
        tags: ["4. Trainer"],
        summary: "Get My Trainer Profile",
        description: "Fetches the authenticated trainer's own complete profile.",
        security: [{ FirebaseAuth: [] }],
        responses: {
          200: {
            description: "Trainer profile fetched",
            content: {
              "application/json": {
                example: {
                  message: "Profile fetched",
                  trainer: { id: "3", full_name: "Priya Sharma", experience_years: 10, approval_status: "PENDING", specializations: [] }
                }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                example: { success: false, message: "Missing Authorization token" }
              }
            }
          }
        }
      }
    },

    "/trainers/{id}": {
      get: {
        tags: ["4. Trainer"],
        summary: "Get Trainer Public Profile (by ID)",
        description: "Public endpoint — returns a trainer's profile by numeric ID. No authentication required.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }
        ],
        responses: {
          200: {
            description: "Public trainer profile",
            content: {
              "application/json": {
                example: {
                  trainer: { id: 1, full_name: "Priya Sharma", bio: "Classical dancer...", experience_years: 10, specializations: [] }
                }
              }
            }
          },
          404: {
            description: "Trainer not found",
            content: {
              "application/json": {
                example: { success: false, message: "Trainer not found" }
              }
            }
          }
        }
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
        responses: {
          200: {
            description: "QR code updated",
            content: {
              "application/json": {
                example: { message: "QR updated successfully" }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                example: { success: false, message: "Missing Authorization token" }
              }
            }
          }
        }
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
                properties: {
                  institute_id: { type: "integer", example: 1 }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Application submitted",
            content: {
              "application/json": {
                example: { message: "Application submitted successfully" }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                example: { success: false, message: "Missing Authorization token" }
              }
            }
          }
        }
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
        responses: {
          200: {
            description: "Institute logged in",
            content: {
              "application/json": {
                example: {
                  message: "Login success",
                  account: { id: "2", firebase_uid: "instituteUID...", email: "institute@gmail.com", is_active: true },
                  role: { role: "INSTITUTE", approval_status: "PENDING" }
                }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                example: { success: false, message: "Missing Authorization token" }
              }
            }
          }
        }
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
        responses: {
          200: {
            description: "Profile completed",
            content: {
              "application/json": {
                example: {
                  message: "Profile updated",
                  institute: { id: "2", name: "Kalai Nilayam Fine Arts", city: "Chennai", approval_status: "PENDING" }
                }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                example: { success: false, message: "Missing Authorization token" }
              }
            }
          }
        }
      }
    },

    "/institutes/profile": {
      get: {
        tags: ["5. Institute"],
        summary: "Get Institute Profile",
        description: "Retrieves the authenticated institute's own profile details.",
        security: [{ FirebaseAuth: [] }],
        responses: {
          200: {
            description: "Institute profile fetched",
            content: {
              "application/json": {
                example: {
                  message: "Profile fetched",
                  institute: { id: "2", name: "Kalai Nilayam Fine Arts", city: "Chennai", state: "Tamil Nadu" }
                }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                example: { success: false, message: "Missing Authorization token" }
              }
            }
          }
        }
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
        responses: {
          200: {
            description: "List of institutes",
            content: {
              "application/json": {
                example: {
                  institutes: [{ id: "2", name: "Kalai Nilayam Fine Arts", city: "Chennai" }],
                  total: 5, page: 1, limit: 10
                }
              }
            }
          }
        }
      }
    },

    "/institutes/{id}/trainers": {
      get: {
        tags: ["5. Institute"],
        summary: "Get Institute Trainers (Public)",
        description: "Returns all trainers associated with a specific institute.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }
        ],
        responses: {
          200: {
            description: "Trainers fetched",
            content: {
              "application/json": {
                example: { trainers: [{ id: 3, full_name: "Priya Sharma", experience_years: 10 }] }
              }
            }
          }
        }
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
        responses: {
          200: {
            description: "Trainer added",
            content: {
              "application/json": {
                example: { message: "Trainer added successfully" }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                example: { success: false, message: "Missing Authorization token" }
              }
            }
          }
        }
      }
    },

    "/classes/institute/trainer-applications": {
      get: {
        tags: ["5. Institute"],
        summary: "Institute View Trainer Applications",
        description: "Returns all trainer applications received by the institute.",
        security: [{ FirebaseAuth: [] }],
        responses: {
          200: {
            description: "Applications fetched",
            content: {
              "application/json": {
                example: { applications: [{ id: 1, trainer_id: 3, status: "PENDING", created_at: "2026-05-01T10:00:00Z" }] }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                example: { success: false, message: "Missing Authorization token" }
              }
            }
          }
        }
      }
    },

    "/classes/institute/trainer-applications/{id}": {
      patch: {
        tags: ["5. Institute"],
        summary: "Accept / Reject Trainer Application",
        description: "Allows an institute to accept or reject a pending trainer application.",
        security: [{ FirebaseAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  action: { type: "string", enum: ["accept", "reject"], example: "accept" }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Application updated",
            content: {
              "application/json": {
                example: { message: "Application accepted successfully" }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                example: { success: false, message: "Missing Authorization token" }
              }
            }
          }
        }
      }
    },

    "/institutes/trainers/{id}/approval": {
      put: {
        tags: ["5. Institute"],
        summary: "Institute Update Trainer Approval Status",
        description: "Updates the approval status of a trainer within the institute.",
        security: [{ FirebaseAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }
        ],
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
        responses: {
          200: {
            description: "Approval status updated",
            content: {
              "application/json": {
                example: { message: "Trainer approval status updated" }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                example: { success: false, message: "Missing Authorization token" }
              }
            }
          }
        }
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
        responses: {
          200: {
            description: "Categories fetched",
            content: {
              "application/json": {
                example: {
                  success: true,
                  categories: [{ id: 1, name: "Bharatanatyam", description: "Classical Indian dance form", image_url: "https://example.com/img.jpg" }]
                }
              }
            }
          }
        }
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
        responses: {
          201: {
            description: "Category created",
            content: {
              "application/json": {
                example: { message: "Category created", category: { id: 1, name: "Bharatanatyam" } }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                example: { success: false, message: "Missing Authorization token" }
              }
            }
          }
        }
      }
    },

    "/categories/{id}": {
      get: {
        tags: ["6. Categories & Subcategories"],
        summary: "Get Category by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        responses: {
          200: {
            description: "Category detail",
            content: {
              "application/json": {
                example: { category: { id: 1, name: "Bharatanatyam", description: "Classical Indian dance form" } }
              }
            }
          },
          404: {
            description: "Not found",
            content: {
              "application/json": {
                example: { success: false, message: "Category not found" }
              }
            }
          }
        }
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
        responses: {
          200: { description: "Category updated", content: { "application/json": { example: { message: "Category updated" } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      },
      delete: {
        tags: ["6. Categories & Subcategories"],
        summary: "Delete Category (Admin)",
        security: [{ AdminAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        responses: {
          200: { description: "Category deleted", content: { "application/json": { example: { message: "Category deleted" } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/subcategories": {
      get: {
        tags: ["6. Categories & Subcategories"],
        summary: "List All Subcategories (Public)",
        responses: {
          200: {
            description: "Subcategories fetched",
            content: {
              "application/json": {
                example: { subcategories: [{ id: 2, category_id: 1, name: "Beginner Bharatanatyam" }] }
              }
            }
          }
        }
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
        responses: {
          201: { description: "Subcategory created", content: { "application/json": { example: { message: "Subcategory created", subcategory: { id: 2, name: "Beginner Bharatanatyam" } } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/subcategories/category/{id}": {
      get: {
        tags: ["6. Categories & Subcategories"],
        summary: "Get Subcategories by Category",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        responses: {
          200: {
            description: "Subcategories for the category",
            content: {
              "application/json": {
                example: { category: { id: 1, name: "Bharatanatyam" }, subcategories: [{ id: 2, name: "Beginner Bharatanatyam" }] }
              }
            }
          }
        }
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
        responses: {
          200: {
            description: "Classes fetched",
            content: {
              "application/json": {
                example: { classes: [{ id: 1, title: "Bharatanatyam for Beginners", price: 1500, level: "BEGINNER", mode: "OFFLINE" }], total: 20 }
              }
            }
          }
        }
      }
    },

    "/classes/{id}": {
      get: {
        tags: ["7. Classes"],
        summary: "Get Class by ID (Public)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        responses: {
          200: {
            description: "Class detail",
            content: {
              "application/json": {
                example: { class: { id: 1, title: "Bharatanatyam for Beginners", price: 1500, level: "BEGINNER", mode: "OFFLINE", max_students: 20 } }
              }
            }
          },
          404: {
            description: "Class not found",
            content: {
              "application/json": {
                example: { success: false, message: "Class not found" }
              }
            }
          }
        }
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
        responses: {
          201: {
            description: "Class created and sent for approval",
            content: {
              "application/json": {
                example: { message: "Class created and sent for approval", class: { id: 5, title: "Bharatanatyam for Beginners", status: "PENDING" } }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                example: { success: false, message: "Missing Authorization token" }
              }
            }
          }
        }
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
        responses: {
          201: {
            description: "Class created",
            content: {
              "application/json": {
                example: { message: "Class created", class: { id: 6, title: "Online Carnatic Music", status: "PENDING" } }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                example: { success: false, message: "Missing Authorization token" }
              }
            }
          }
        }
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
        responses: {
          200: { description: "Class updated", content: { "application/json": { example: { message: "Class updated" } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/classes/trainer/{id}": {
      delete: {
        tags: ["7. Classes"],
        summary: "Delete Class (Trainer)",
        security: [{ FirebaseAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        responses: {
          200: { description: "Class deleted", content: { "application/json": { example: { message: "Class deleted" } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
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
        responses: {
          200: {
            description: "QR code and amount",
            content: {
              "application/json": {
                example: { qr_image_url: "https://example.com/qr.png", upi_id: "priya@upi", amount: 1500 }
              }
            }
          }
        }
      }
    },

    "/payments/qr-settings": {
      get: {
        tags: ["8. Payments (QR Flow)"],
        summary: "Get Platform QR Settings (Public)",
        responses: {
          200: {
            description: "Platform QR settings",
            content: {
              "application/json": {
                example: { qr_image_url: "https://platform-qr.png", upi_id: "finearts@upi" }
              }
            }
          }
        }
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
        responses: {
          200: {
            description: "Payment submitted for verification",
            content: {
              "application/json": {
                example: { message: "Payment submitted for verification", payment_id: 10 }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                example: { success: false, message: "Missing Authorization token" }
              }
            }
          }
        }
      }
    },

    "/payments/my": {
      get: {
        tags: ["8. Payments (QR Flow)"],
        summary: "Get My Payments",
        security: [{ FirebaseAuth: [] }],
        responses: {
          200: {
            description: "Payment history",
            content: {
              "application/json": {
                example: { payments: [{ id: 10, amount: 1500, status: "PENDING", utr_number: "UTR123456789", created_at: "2026-05-01T10:00:00Z" }] }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                example: { success: false, message: "Missing Authorization token" }
              }
            }
          }
        }
      }
    },

    "/payments/pending": {
      get: {
        tags: ["8. Payments (QR Flow)"],
        summary: "Get Pending Payments (Admin / Institute)",
        security: [{ FirebaseAuth: [] }],  // ✅ FIX: was MISSING
        responses: {
          200: {
            description: "Pending payments",
            content: {
              "application/json": {
                example: { payments: [{ id: 10, user_id: 5, amount: 1500, status: "PENDING" }] }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                example: { success: false, message: "Missing Authorization token" }
              }
            }
          }
        }
      }
    },

    "/payments/{id}/verify": {
      patch: {
        tags: ["8. Payments (QR Flow)"],
        summary: "Verify Payment (Admin)",
        security: [{ AdminAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        responses: {
          200: { description: "Payment verified", content: { "application/json": { example: { message: "Payment verified and booking confirmed" } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
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
        responses: {
          200: { description: "Payment rejected", content: { "application/json": { example: { message: "Payment rejected" } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
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
        responses: {
          201: {
            description: "Booking created",
            content: {
              "application/json": {
                example: { message: "Booking created", booking: { id: 7, status: "PENDING", class_id: 1 } }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/bookings/my": {
      get: {
        tags: ["9. Bookings"],
        summary: "Get My Bookings",
        security: [{ FirebaseAuth: [] }],
        responses: {
          200: {
            description: "User bookings",
            content: {
              "application/json": {
                example: { bookings: [{ id: 7, class_id: 1, status: "CONFIRMED", start_date: "2026-06-01" }] }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/bookings/{id}": {
      get: {
        tags: ["9. Bookings"],
        summary: "Get Booking by ID",
        security: [{ FirebaseAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        responses: {
          200: {
            description: "Booking detail",
            content: {
              "application/json": {
                example: { booking: { id: 7, class_id: 1, status: "CONFIRMED", amount: 1500 } }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/bookings/{id}/cancel": {
      patch: {
        tags: ["9. Bookings"],
        summary: "Cancel Booking",
        security: [{ FirebaseAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        responses: {
          200: { description: "Booking cancelled", content: { "application/json": { example: { message: "Booking cancelled" } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/bookings/{id}/confirm": {
      patch: {
        tags: ["9. Bookings"],
        summary: "Confirm Booking",
        security: [{ FirebaseAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        responses: {
          200: { description: "Booking confirmed", content: { "application/json": { example: { message: "Booking confirmed" } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/bookings/{id}/complete": {
      patch: {
        tags: ["9. Bookings"],
        summary: "Complete Booking",
        security: [{ FirebaseAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        responses: {
          200: { description: "Booking completed", content: { "application/json": { example: { message: "Booking completed" } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/bookings/class/{id}": {
      get: {
        tags: ["9. Bookings"],
        summary: "Get Bookings by Class",
        security: [{ FirebaseAuth: [] }],  // ✅ FIX: was MISSING
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        responses: {
          200: { description: "Class bookings", content: { "application/json": { example: { bookings: [{ id: 7, user_id: 5, status: "CONFIRMED" }] } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/bookings/trainer/{id}": {
      get: {
        tags: ["9. Bookings"],
        summary: "Get Bookings by Trainer",
        security: [{ FirebaseAuth: [] }],  // ✅ FIX: was MISSING
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        responses: {
          200: { description: "Trainer bookings", content: { "application/json": { example: { bookings: [{ id: 7, class_id: 1, status: "CONFIRMED" }] } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/bookings/institute/{id}": {
      get: {
        tags: ["9. Bookings"],
        summary: "Get Bookings by Institute",
        security: [{ FirebaseAuth: [] }],  // ✅ FIX: was MISSING
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        responses: {
          200: { description: "Institute bookings", content: { "application/json": { example: { bookings: [{ id: 7, class_id: 1, status: "CONFIRMED" }] } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/bookings/check-eligibility": {
      post: {
        tags: ["9. Bookings"],
        summary: "Check Booking Eligibility",
        security: [{ FirebaseAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", properties: { class_id: { type: "integer", example: 1 } } }
            }
          }
        },
        responses: {
          200: {
            description: "Eligibility result",
            content: {
              "application/json": {
                example: { eligible: true, message: "You can book this class" }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    // ─────────────────────────────────────────────
    // 10. SUBSCRIPTIONS
    // ─────────────────────────────────────────────
    "/subscriptions": {
      get: {
        tags: ["10. Subscriptions"],
        summary: "List Plans (Public)",
        parameters: [
          { name: "plan_type", in: "query", schema: { type: "string", enum: ["USER", "TRAINER", "INSTITUTE"], example: "USER" } }
        ],
        responses: {
          200: {
            description: "Subscription plans",
            content: {
              "application/json": {
                example: { plans: [{ id: 1, name: "Monthly Premium", price: 999, duration_days: 30, plan_type: "USER" }] }
              }
            }
          }
        }
      },
      post: {
        tags: ["10. Subscriptions"],
        summary: "Create Plan (Admin)",
        security: [{ AdminAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Monthly Premium" },
                  description: { type: "string", example: "Access all classes for 30 days" },
                  price: { type: "number", example: 999 },
                  duration_days: { type: "integer", example: 30 },
                  plan_type: { type: "string", enum: ["USER", "TRAINER", "INSTITUTE"], example: "USER" },
                  features: { type: "string", example: "Unlimited class views, Priority booking, 10% discount on all classes" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Plan created", content: { "application/json": { example: { message: "Plan created", plan: { id: 1, name: "Monthly Premium" } } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/subscriptions/{id}": {
      get: {
        tags: ["10. Subscriptions"],
        summary: "Get Plan by ID (Public)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        responses: {
          200: { description: "Plan detail", content: { "application/json": { example: { plan: { id: 1, name: "Monthly Premium", price: 999, features: "..." } } } } }
        }
      },
      put: {
        tags: ["10. Subscriptions"],
        summary: "Update Plan (Admin)",
        security: [{ AdminAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", properties: { name: { type: "string", example: "Monthly Premium" }, price: { type: "number", example: 1199 }, duration_days: { type: "integer", example: 30 }, is_active: { type: "integer", example: 1 } } }
            }
          }
        },
        responses: {
          200: { description: "Plan updated", content: { "application/json": { example: { message: "Plan updated" } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/subscriptions/subscribe": {
      post: {
        tags: ["10. Subscriptions"],
        summary: "Subscribe to Plan (User)",
        security: [{ FirebaseAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  plan_id: { type: "integer", example: 1 },
                  payment_id: { type: "string", example: "UTR_SUB_123456" }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Subscribed successfully",
            content: {
              "application/json": {
                example: { message: "Subscribed successfully", subscription: { id: 3, plan_id: 1, status: "ACTIVE", expires_at: "2026-06-01" } }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/subscriptions/my/active": {
      get: {
        tags: ["10. Subscriptions"],
        summary: "Get My Active Subscription",
        security: [{ FirebaseAuth: [] }],
        responses: {
          200: {
            description: "Active subscription",
            content: {
              "application/json": {
                example: { subscription: { id: 3, plan: "Monthly Premium", expires_at: "2026-06-01", status: "ACTIVE" } }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/subscriptions/cancel/{id}": {
      delete: {
        tags: ["10. Subscriptions"],
        summary: "Cancel Subscription",
        security: [{ FirebaseAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        responses: {
          200: { description: "Subscription cancelled", content: { "application/json": { example: { message: "Subscription cancelled" } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
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
        responses: {
          201: { description: "Coupon created", content: { "application/json": { example: { message: "Coupon created", coupon: { id: 1, code: "WELCOME20" } } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      },
      get: {
        tags: ["11. Coupons & Rewards"],
        summary: "List All Coupons (Admin)",
        security: [{ AdminAuth: [] }],
        responses: {
          200: { description: "All coupons", content: { "application/json": { example: { coupons: [{ id: 1, code: "WELCOME20", is_active: true, discount_type: "PERCENT" }] } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
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
        responses: {
          200: { description: "Coupon toggled", content: { "application/json": { example: { message: "Coupon status updated" } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
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
        responses: {
          200: {
            description: "Coupon validation result",
            content: {
              "application/json": {
                example: { valid: true, discount_amount: 150, final_amount: 1350 }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/coupons/rewards/my": {
      get: {
        tags: ["11. Coupons & Rewards"],
        summary: "Get My Rewards & Points",
        security: [{ FirebaseAuth: [] }],
        responses: {
          200: {
            description: "Rewards and points balance",
            content: {
              "application/json": {
                example: { points_balance: 120, total_earned: 200, total_redeemed: 80 }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
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
        responses: {
          200: {
            description: "Points redeemed",
            content: {
              "application/json": {
                example: { message: "Points redeemed", discount_amount: 5, remaining_points: 70 }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
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
        responses: {
          200: { description: "Institutes list", content: { "application/json": { example: { institutes: [{ id: 2, name: "Kalai Nilayam Fine Arts", status: "PENDING" }] } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/admin/institutes/pending": {
      get: {
        tags: ["12. Admin Panel"],
        summary: "Get Pending Institutes",
        security: [{ AdminAuth: [] }],
        responses: {
          200: { description: "Pending institutes", content: { "application/json": { example: { institutes: [{ id: 2, name: "Kalai Nilayam Fine Arts", approval_status: "PENDING" }] } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/admin/institutes/{id}/approve": {
      patch: {
        tags: ["12. Admin Panel"],
        summary: "Approve Institute",
        security: [{ AdminAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        responses: {
          200: { description: "Institute approved", content: { "application/json": { example: { message: "Institute approved" } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
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
        responses: {
          200: { description: "Institute rejected", content: { "application/json": { example: { message: "Institute rejected" } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
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
        responses: {
          200: { description: "Trainers list", content: { "application/json": { example: { trainers: [{ id: 3, full_name: "Priya Sharma", approval_status: "PENDING" }] } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/admin/trainers/pending": {
      get: {
        tags: ["12. Admin Panel"],
        summary: "Get Pending Trainers",
        security: [{ AdminAuth: [] }],
        responses: {
          200: { description: "Pending trainers", content: { "application/json": { example: { trainers: [{ id: 3, full_name: "Priya Sharma", status: "PENDING" }] } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/admin/trainers/{id}/approve": {
      patch: {
        tags: ["12. Admin Panel"],
        summary: "Approve Trainer",
        security: [{ AdminAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        responses: {
          200: { description: "Trainer approved", content: { "application/json": { example: { message: "Trainer approved" } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
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
        responses: {
          200: { description: "Trainer rejected", content: { "application/json": { example: { message: "Trainer rejected" } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/admin/classes/pending": {
      get: {
        tags: ["12. Admin Panel"],
        summary: "Get Pending Classes",
        security: [{ AdminAuth: [] }],
        responses: {
          200: { description: "Pending classes", content: { "application/json": { example: { classes: [{ id: 5, title: "Bharatanatyam for Beginners", status: "PENDING" }] } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/admin/classes/{id}/approve": {
      patch: {
        tags: ["12. Admin Panel"],
        summary: "Approve Class",
        security: [{ AdminAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        responses: {
          200: { description: "Class approved", content: { "application/json": { example: { message: "Class approved" } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
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
        responses: {
          200: { description: "Class rejected", content: { "application/json": { example: { message: "Class rejected" } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
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
        responses: {
          200: { description: "User dashboard data", content: { "application/json": { example: { active_bookings: 2, upcoming_classes: 3, subscription: "Monthly Premium", points: 120 } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/dashboard/trainer": {
      get: {
        tags: ["13. Dashboard"],
        summary: "Trainer Dashboard",
        security: [{ FirebaseAuth: [] }],
        responses: {
          200: { description: "Trainer dashboard data", content: { "application/json": { example: { total_classes: 5, total_students: 48, total_earnings: 12000 } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/dashboard/institute": {
      get: {
        tags: ["13. Dashboard"],
        summary: "Institute Dashboard",
        security: [{ FirebaseAuth: [] }],
        responses: {
          200: { description: "Institute dashboard data", content: { "application/json": { example: { total_trainers: 8, total_classes: 12, total_bookings: 96 } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/dashboard/admin": {
      get: {
        tags: ["13. Dashboard"],
        summary: "Admin Dashboard",
        security: [{ AdminAuth: [] }],  // ✅ FIX: changed from FirebaseAuth to AdminAuth (admin route)
        responses: {
          200: { description: "Admin dashboard data", content: { "application/json": { example: { pending_institutes: 3, pending_trainers: 5, total_users: 240, total_revenue: 85000 } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/dashboard/admin/revenue": {
      get: {
        tags: ["13. Dashboard"],
        summary: "Admin Revenue Report",
        security: [{ AdminAuth: [] }],  // ✅ FIX: changed from FirebaseAuth to AdminAuth (admin route)
        responses: {
          200: { description: "Revenue report", content: { "application/json": { example: { total_revenue: 85000, this_month: 12000, last_month: 10500 } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/dashboard/admin/bookings-summary": {
      get: {
        tags: ["13. Dashboard"],
        summary: "Admin Bookings Summary",
        security: [{ AdminAuth: [] }],  // ✅ FIX: changed from FirebaseAuth to AdminAuth (admin route)
        responses: {
          200: { description: "Bookings summary", content: { "application/json": { example: { total: 320, confirmed: 260, pending: 40, cancelled: 20 } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/dashboard/admin/users-summary": {
      get: {
        tags: ["13. Dashboard"],
        summary: "Admin Users Summary",
        security: [{ AdminAuth: [] }],  // ✅ FIX: changed from FirebaseAuth to AdminAuth (admin route)
        responses: {
          200: { description: "Users summary", content: { "application/json": { example: { total_users: 240, total_trainers: 35, total_institutes: 12 } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
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
        responses: {
          200: {
            description: "User notifications",
            content: {
              "application/json": {
                example: { notifications: [{ id: 1, title: "Class Reminder", message: "Your class starts in 1 hour", is_read: false, created_at: "2026-05-01T09:00:00Z" }] }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/notifications/{id}/read": {
      patch: {
        tags: ["14. Notifications"],
        summary: "Mark Notification as Read",
        security: [{ FirebaseAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        responses: {
          200: { description: "Notification marked as read", content: { "application/json": { example: { message: "Notification marked as read" } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    },

    "/notifications/read-all": {
      patch: {
        tags: ["14. Notifications"],
        summary: "Mark All Notifications as Read",
        security: [{ FirebaseAuth: [] }],
        responses: {
          200: { description: "All notifications marked as read", content: { "application/json": { example: { message: "All notifications marked as read" } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
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
        responses: {
          200: { description: "Notification sent", content: { "application/json": { example: { message: "Notification sent successfully" } } } },
          401: { description: "Unauthorized", content: { "application/json": { example: { success: false, message: "Missing Authorization token" } } } }
        }
      }
    }

  }
};