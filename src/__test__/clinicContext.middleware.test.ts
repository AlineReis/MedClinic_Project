import { Request, Response, NextFunction } from "express";
import { clinicContextMiddleware } from "../middlewares/clinicContext.middleware.js";
import { ForbiddenError, ValidationError } from "../utils/errors.js";

describe("Clinic Context Middleware - RN-Phase4.1 Multi-Tenancy", () => {
  describe("Validation Errors", () => {
    test("should reject missing clinic_id", () => {
      const mockRequest = {
        params: {},
        user: {
          id: 1,
          name: "Test User",
          email: "test@example.com",
          role: "patient" as const,
          clinic_id: 1,
        },
      } as Request;

      const mockResponse = {} as Response;
      let capturedError: any;
      const nextFunction = (err?: any) => {
        capturedError = err;
      };

      clinicContextMiddleware(mockRequest, mockResponse, nextFunction);

      expect(capturedError).toBeInstanceOf(ValidationError);
      expect(capturedError.message).toBe("Invalid clinic_id in URL");
      expect(capturedError.statusCode).toBe(400);
    });

    test("should reject invalid clinic_id format", () => {
      const mockRequest = {
        params: { clinic_id: "abc" },
        user: {
          id: 1,
          name: "Test User",
          email: "test@example.com",
          role: "patient" as const,
          clinic_id: 1,
        },
      } as Request;

      const mockResponse = {} as Response;
      let capturedError: any;
      const nextFunction = (err?: any) => {
        capturedError = err;
      };

      clinicContextMiddleware(mockRequest, mockResponse, nextFunction);

      expect(capturedError).toBeInstanceOf(ValidationError);
      expect(capturedError.message).toBe("Invalid clinic_id in URL");
    });

    test("should reject when user is not authenticated", () => {
      const mockRequest = {
        params: { clinic_id: "1" },
        user: undefined,
      } as Request;

      const mockResponse = {} as Response;
      let capturedError: any;
      const nextFunction = (err?: any) => {
        capturedError = err;
      };

      clinicContextMiddleware(mockRequest, mockResponse, nextFunction);

      expect(capturedError).toBeInstanceOf(ForbiddenError);
      expect(capturedError.message).toBe("Authentication required");
    });
  });

  describe("Multi-Tenancy Enforcement", () => {
    test("should allow access when user's clinic_id matches requested clinic_id", () => {
      const mockRequest = {
        params: { clinic_id: "1" },
        user: {
          id: 1,
          name: "Test User",
          email: "test@example.com",
          role: "patient" as const,
          clinic_id: 1,
        },
      } as Request;

      const mockResponse = {} as Response;
      let nextCalled = false;
      let capturedError: any;
      const nextFunction = (err?: any) => {
        if (err) {
          capturedError = err;
        } else {
          nextCalled = true;
        }
      };

      clinicContextMiddleware(mockRequest, mockResponse, nextFunction);

      expect(nextCalled).toBe(true);
      expect(capturedError).toBeUndefined();
      expect(mockRequest.user?.requestedClinicId).toBe(1);
    });

    test("should deny access when user's clinic_id does not match requested clinic_id", () => {
      const mockRequest = {
        params: { clinic_id: "2" },
        user: {
          id: 1,
          name: "Test User",
          email: "test@example.com",
          role: "patient" as const,
          clinic_id: 1,
        },
      } as Request;

      const mockResponse = {} as Response;
      let capturedError: any;
      const nextFunction = (err?: any) => {
        capturedError = err;
      };

      clinicContextMiddleware(mockRequest, mockResponse, nextFunction);

      expect(capturedError).toBeInstanceOf(ForbiddenError);
      expect(capturedError.message).toBe(
        "Access denied: You cannot access data from a different clinic",
      );
    });

    test("should deny patient from accessing different clinic", () => {
      const mockRequest = {
        params: { clinic_id: "5" },
        user: {
          id: 10,
          name: "Patient User",
          email: "patient@clinic1.com",
          role: "patient" as const,
          clinic_id: 1,
        },
      } as Request;

      const mockResponse = {} as Response;
      let capturedError: any;
      const nextFunction = (err?: any) => {
        capturedError = err;
      };

      clinicContextMiddleware(mockRequest, mockResponse, nextFunction);

      expect(capturedError).toBeInstanceOf(ForbiddenError);
    });

    test("should deny receptionist from accessing different clinic", () => {
      const mockRequest = {
        params: { clinic_id: "3" },
        user: {
          id: 20,
          name: "Receptionist User",
          email: "receptionist@clinic2.com",
          role: "receptionist" as const,
          clinic_id: 2,
        },
      } as Request;

      const mockResponse = {} as Response;
      let capturedError: any;
      const nextFunction = (err?: any) => {
        capturedError = err;
      };

      clinicContextMiddleware(mockRequest, mockResponse, nextFunction);

      expect(capturedError).toBeInstanceOf(ForbiddenError);
    });

    test("should deny health_professional from accessing different clinic", () => {
      const mockRequest = {
        params: { clinic_id: "4" },
        user: {
          id: 30,
          name: "Doctor User",
          email: "doctor@clinic3.com",
          role: "health_professional" as const,
          clinic_id: 3,
        },
      } as Request;

      const mockResponse = {} as Response;
      let capturedError: any;
      const nextFunction = (err?: any) => {
        capturedError = err;
      };

      clinicContextMiddleware(mockRequest, mockResponse, nextFunction);

      expect(capturedError).toBeInstanceOf(ForbiddenError);
    });

    test("should deny clinic_admin from accessing different clinic", () => {
      const mockRequest = {
        params: { clinic_id: "2" },
        user: {
          id: 40,
          name: "Admin User",
          email: "admin@clinic1.com",
          role: "clinic_admin" as const,
          clinic_id: 1,
        },
      } as Request;

      const mockResponse = {} as Response;
      let capturedError: any;
      const nextFunction = (err?: any) => {
        capturedError = err;
      };

      clinicContextMiddleware(mockRequest, mockResponse, nextFunction);

      expect(capturedError).toBeInstanceOf(ForbiddenError);
    });
  });

  describe("System Admin Privileges", () => {
    test("should allow system_admin to access any clinic", () => {
      const mockRequest = {
        params: { clinic_id: "5" },
        user: {
          id: 100,
          name: "System Admin",
          email: "sysadmin@medclinic.com",
          role: "system_admin" as const,
          clinic_id: 1,
        },
      } as Request;

      const mockResponse = {} as Response;
      let nextCalled = false;
      let capturedError: any;
      const nextFunction = (err?: any) => {
        if (err) {
          capturedError = err;
        } else {
          nextCalled = true;
        }
      };

      clinicContextMiddleware(mockRequest, mockResponse, nextFunction);

      expect(nextCalled).toBe(true);
      expect(capturedError).toBeUndefined();
      expect(mockRequest.user?.requestedClinicId).toBe(5);
    });

    test("should allow system_admin to access different clinic than their own", () => {
      const mockRequest = {
        params: { clinic_id: "99" },
        user: {
          id: 101,
          name: "Another System Admin",
          email: "admin2@medclinic.com",
          role: "system_admin" as const,
          clinic_id: 1,
        },
      } as Request;

      const mockResponse = {} as Response;
      let nextCalled = false;
      let capturedError: any;
      const nextFunction = (err?: any) => {
        if (err) {
          capturedError = err;
        } else {
          nextCalled = true;
        }
      };

      clinicContextMiddleware(mockRequest, mockResponse, nextFunction);

      expect(nextCalled).toBe(true);
      expect(capturedError).toBeUndefined();
      expect(mockRequest.user?.requestedClinicId).toBe(99);
    });
  });

  describe("Request Context", () => {
    test("should set requestedClinicId in user object for regular users", () => {
      const mockRequest = {
        params: { clinic_id: "7" },
        user: {
          id: 50,
          name: "Lab Tech",
          email: "lab@clinic7.com",
          role: "lab_tech" as const,
          clinic_id: 7,
        },
      } as Request;

      const mockResponse = {} as Response;
      let nextCalled = false;
      const nextFunction = (err?: any) => {
        if (!err) nextCalled = true;
      };

      clinicContextMiddleware(mockRequest, mockResponse, nextFunction);

      expect(nextCalled).toBe(true);
      expect(mockRequest.user?.requestedClinicId).toBe(7);
    });

    test("should set requestedClinicId in user object for system admin", () => {
      const mockRequest = {
        params: { clinic_id: "42" },
        user: {
          id: 100,
          name: "System Admin",
          email: "sysadmin@medclinic.com",
          role: "system_admin" as const,
          clinic_id: 1,
        },
      } as Request;

      const mockResponse = {} as Response;
      let nextCalled = false;
      const nextFunction = (err?: any) => {
        if (!err) nextCalled = true;
      };

      clinicContextMiddleware(mockRequest, mockResponse, nextFunction);

      expect(nextCalled).toBe(true);
      expect(mockRequest.user?.requestedClinicId).toBe(42);
    });
  });
});
