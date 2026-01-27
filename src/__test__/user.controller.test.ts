import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";

import { UserController } from "../controller/user.controller.js";

type PaginatedUsers = {
  items: Array<Record<string, unknown>>;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type ListUsersByClinicParams = {
  clinicId: number;
  requester: { id: number; role: string; clinic_id?: number };
  filters: {
    role: string;
    search?: string;
    page: number;
    pageSize: number;
  };
};

class FakeUserService {
  public async listUsersByClinic(
    params: Partial<ListUsersByClinicParams> = {},
  ): Promise<PaginatedUsers> {
    const page = params.filters?.page ?? 1;
    const pageSize = params.filters?.pageSize ?? 10;

    return {
      items: [
        {
          id: 1,
          name: "Dr. Example",
          email: "doctor@example.com",
          role: "health_professional",
        },
      ],
      page,
      pageSize,
      total: 1,
      totalPages: 1,
    };
  }
}

describe("UserController.listByClinic", () => {
  let controller: UserController;
  let fakeService: FakeUserService;

  const makeRequest = () => {
    const mockReq = {
      params: { clinic_id: "42" },
      query: { page: "2", pageSize: "5" },
      user: {
        id: 99,
        role: "clinic_admin",
        clinic_id: 42,
        name: "Admin",
        email: "admin@example.com",
      } as any,
    } as Partial<Request>;

    const jsonSpy = jest.fn();
    const statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });

    const mockRes = {
      status: statusSpy as unknown as jest.Mock,
    } as Partial<Response>;

    const nextFn = jest.fn() as unknown as NextFunction;

    return {
      req: mockReq as Request,
      res: mockRes as Response,
      next: nextFn,
      statusSpy,
      jsonSpy,
    };
  };

  beforeEach(() => {
    fakeService = new FakeUserService();
    controller = new UserController(fakeService as any);
  });

  it("should return paginated results with expected structure", async () => {
    const { req, res, next, statusSpy, jsonSpy } = makeRequest();

    await controller.listByClinic(req, res, next);

    expect(statusSpy).toHaveBeenCalledWith(200);
    expect(jsonSpy).toHaveBeenCalledWith({
      success: true,
      users: {
        items: [
          {
            id: 1,
            name: "Dr. Example",
            email: "doctor@example.com",
            role: "health_professional",
          },
        ],
        page: 2,
        pageSize: 5,
        total: 1,
        totalPages: 1,
      },
    });
  });

  it("should pass converted query filters to the service", async () => {
    const spy = jest.spyOn(fakeService, "listUsersByClinic");
    const { req, res, next } = makeRequest();

    await controller.listByClinic(req, res, next);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        clinicId: 42,
        requester: expect.objectContaining({
          id: 99,
          role: "clinic_admin",
          clinic_id: 42,
        }),
        filters: expect.objectContaining({
          page: 2,
          pageSize: 5,
        }),
      }),
    );
  });

  it("should call next with error if service fails", async () => {
    const { req, res, next } = makeRequest();
    const error = new Error("Service Failure");

    jest.spyOn(fakeService, "listUsersByClinic").mockRejectedValue(error);

    await controller.listByClinic(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });

  it("should use default pagination values when query is empty", async () => {
    const { res, next } = makeRequest();
    const spy = jest.spyOn(fakeService, "listUsersByClinic");

    const reqWithoutQuery = {
      params: { clinic_id: "42" },
      query: {},
      user: { id: 99, role: "clinic_admin", clinic_id: 42 },
    } as unknown as Request;

    await controller.listByClinic(reqWithoutQuery, res, next);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          page: 1,
          pageSize: 10,
        }),
      }),
    );
  });

  it("should pass search and role filters when they are provided in the query", async () => {
    const { res, next } = makeRequest();
    const spy = jest.spyOn(fakeService, "listUsersByClinic");

    const reqWithFilters = {
      params: { clinic_id: "42" },
      query: {
        page: "1",
        pageSize: "10",
        search: "John Doe",
        role: "admin",
      },
      user: { id: 99, role: "clinic_admin", clinic_id: 42 },
    } as unknown as Request;

    await controller.listByClinic(reqWithFilters, res, next);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          search: "John Doe",
          role: "admin",
        }),
      }),
    );
  });

  describe("Input Validation & Security (To Be Implemented)", () => {
    it.skip("should handle invalid pagination strings by falling back to defaults", async () => {
      const { res, next } = makeRequest();
      const spy = jest.spyOn(fakeService, "listUsersByClinic");

      const reqWithGarbage = {
        params: { clinic_id: "42" },
        query: { page: "not-a-number", pageSize: "undefined" },
        user: { id: 99, role: "clinic_admin", clinic_id: 42 },
      } as unknown as Request;

      await controller.listByClinic(reqWithGarbage, res, next);

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({ page: 1, pageSize: 10 }),
        }),
      );
    });

    it.skip("should throw an error if requester tries to access a different clinic_id", async () => {
      const { res, next } = makeRequest();

      const maliciousReq = {
        params: { clinic_id: "999" },
        query: {},
        user: { id: 99, role: "clinic_admin", clinic_id: 42 },
      } as unknown as Request;

      await controller.listByClinic(maliciousReq, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Forbidden"),
        }),
      );
    });

    it.skip("should ignore search filter if it is an empty string", async () => {
      const { res, next } = makeRequest();
      const spy = jest.spyOn(fakeService, "listUsersByClinic");

      const reqWithEmptySearch = {
        params: { clinic_id: "42" },
        query: { search: "   " },
        user: { id: 99, role: "clinic_admin", clinic_id: 42 },
      } as unknown as Request;

      await controller.listByClinic(reqWithEmptySearch, res, next);

      const [callArgs] = spy.mock.calls[0] as [ListUsersByClinicParams];
      expect(callArgs.filters.search).toBeUndefined();
    });

    it.skip("should not pass unknown query parameters to the service", async () => {
      const { res, next } = makeRequest();
      const spy = jest.spyOn(fakeService, "listUsersByClinic");

      const reqWithExtraParams = {
        params: { clinic_id: "42" },
        query: { page: "1", admin: "true", delete_all: "1" },
        user: { id: 99, role: "clinic_admin", clinic_id: 42 },
      } as unknown as Request;

      await controller.listByClinic(reqWithExtraParams, res, next);

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: {
            page: 1,
            pageSize: 10,
          },
        }),
      );
    });
  });
});
