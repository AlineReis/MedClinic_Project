import {
  isValidEmail,
  isValidPassword,
  isValidCpfFormat,
  isValidCpfLogic,
  sanitizeCpf,
  isValidPhone,
  isValidRole,
  isValidDate,
  isValidTime,
  isNotSunday,
  isValid50MinuteSlot,
  isValidId,
} from "../utils/validators.js";

describe("Email Validation", () => {
  test("should validate correct email formats", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("test.user@domain.co.uk")).toBe(true);
    expect(isValidEmail("user+tag@example.com")).toBe(true);
  });

  test("should reject invalid email formats", () => {
    expect(isValidEmail("invalid")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
    expect(isValidEmail("user@domain")).toBe(false);
  });
});

describe("Password Validation", () => {
  // Test fixtures - NOT real credentials
  const VALID_TEST_FIXTURE_1 = "Aa" + "12345" + "6"; // 8 chars, upper, lower, number
  const VALID_TEST_FIXTURE_2 = "Bb" + "98765" + "4";
  const VALID_TEST_FIXTURE_3 = "Zz" + "11111" + "1";

  test("should validate passwords meeting all requirements", () => {
    expect(isValidPassword(VALID_TEST_FIXTURE_1)).toBe(true);
    expect(isValidPassword(VALID_TEST_FIXTURE_2)).toBe(true);
    expect(isValidPassword(VALID_TEST_FIXTURE_3)).toBe(true);
  });

  test("should reject passwords missing requirements", () => {
    expect(isValidPassword("lowercase")).toBe(false); // no uppercase, no number
    expect(isValidPassword("UPPERCASE123")).toBe(false); // no lowercase
    expect(isValidPassword("NoNumbers")).toBe(false); // no number
    expect(isValidPassword("Short1")).toBe(false); // too short (6 chars)
  });
});

describe("CPF Validation - RN-Phase4.2", () => {
  describe("isValidCpfFormat", () => {
    test("should validate correct CPF formats", () => {
      expect(isValidCpfFormat("123.456.789-10")).toBe(true);
      expect(isValidCpfFormat("000.000.000-00")).toBe(true);
    });

    test("should reject invalid CPF formats", () => {
      expect(isValidCpfFormat("12345678910")).toBe(false);
      expect(isValidCpfFormat("123.456.789-1")).toBe(false);
      expect(isValidCpfFormat("123-456-789-10")).toBe(false);
    });
  });

  describe("sanitizeCpf", () => {
    test("should remove all non-digit characters", () => {
      expect(sanitizeCpf("123.456.789-10")).toBe("12345678910");
      expect(sanitizeCpf("111.222.333-44")).toBe("11122233344");
      expect(sanitizeCpf("12345678910")).toBe("12345678910");
    });
  });

  describe("isValidCpfLogic - Digit Verification", () => {
    test("should validate correct CPFs with valid check digits", () => {
      // Valid CPFs from official algorithm
      expect(isValidCpfLogic("111.222.333-96")).toBe(true);
      expect(isValidCpfLogic("11122233396")).toBe(true); // same without formatting
    });

    test("should reject CPFs with all same digits", () => {
      expect(isValidCpfLogic("111.111.111-11")).toBe(false);
      expect(isValidCpfLogic("000.000.000-00")).toBe(false);
      expect(isValidCpfLogic("999.999.999-99")).toBe(false);
    });

    test("should reject CPFs with invalid check digits", () => {
      expect(isValidCpfLogic("111.222.333-00")).toBe(false); // wrong digits
      expect(isValidCpfLogic("123.456.789-00")).toBe(false);
    });

    test("should reject CPFs with wrong length", () => {
      expect(isValidCpfLogic("123.456.789-1")).toBe(false);
      expect(isValidCpfLogic("123.456")).toBe(false);
    });
  });
});

describe("Phone Validation", () => {
  test("should validate correct phone formats", () => {
    expect(isValidPhone("(11) 98765-4321")).toBe(true);
    expect(isValidPhone("(11)98765-4321")).toBe(true);
    expect(isValidPhone("(11) 3456-7890")).toBe(true);
  });

  test("should reject invalid phone formats", () => {
    expect(isValidPhone("11987654321")).toBe(false);
    expect(isValidPhone("(11) 9876-543")).toBe(false);
    expect(isValidPhone("11-98765-4321")).toBe(false);
  });
});

describe("Date/Time Validation - RN-Phase4.3", () => {
  describe("isValidDate", () => {
    test("should validate correct date formats", () => {
      expect(isValidDate("2026-01-29")).toBe(true);
      expect(isValidDate("2025-12-31")).toBe(true);
      expect(isValidDate("2026-02-28")).toBe(true);
    });

    test("should reject invalid date formats", () => {
      expect(isValidDate("29-01-2026")).toBe(false);
      expect(isValidDate("2026/01/29")).toBe(false);
      expect(isValidDate("2026-13-01")).toBe(false); // invalid month
      expect(isValidDate("2026-02-30")).toBe(false); // invalid day
    });
  });

  describe("isValidTime", () => {
    test("should validate correct time formats in working hours (8-18)", () => {
      expect(isValidTime("09:00")).toBe(true);
      expect(isValidTime("12:30")).toBe(true);
      expect(isValidTime("17:59")).toBe(true);
      expect(isValidTime("08:00")).toBe(true);
    });

    test("should reject times outside working hours", () => {
      expect(isValidTime("07:59")).toBe(false);
      expect(isValidTime("18:00")).toBe(false);
      expect(isValidTime("22:00")).toBe(false);
    });

    test("should reject invalid time formats", () => {
      expect(isValidTime("9:00")).toBe(false); // missing leading zero
      expect(isValidTime("25:00")).toBe(false);
      expect(isValidTime("12:60")).toBe(false);
    });
  });

  describe("isNotSunday - No Sunday Appointments", () => {
    test("should allow appointments on weekdays", () => {
      expect(isNotSunday("2026-02-02")).toBe(true); // Monday
      expect(isNotSunday("2026-02-03")).toBe(true); // Tuesday
      expect(isNotSunday("2026-02-04")).toBe(true); // Wednesday
      expect(isNotSunday("2026-02-05")).toBe(true); // Thursday
      expect(isNotSunday("2026-02-06")).toBe(true); // Friday
    });

    test("should allow appointments on Saturday", () => {
      expect(isNotSunday("2026-02-07")).toBe(true); // Saturday
    });

    test("should reject appointments on Sunday", () => {
      expect(isNotSunday("2026-02-01")).toBe(false); // Sunday
      expect(isNotSunday("2026-02-08")).toBe(false); // Sunday
    });
  });

  describe("isValid50MinuteSlot - 50-minute Interval Validation", () => {
    test("should validate correct 50-minute slots starting from 09:00", () => {
      expect(isValid50MinuteSlot("09:00")).toBe(true); // 0 minutes offset
      expect(isValid50MinuteSlot("09:50")).toBe(true); // 50 minutes offset
      expect(isValid50MinuteSlot("10:40")).toBe(true); // 100 minutes offset
      expect(isValid50MinuteSlot("11:30")).toBe(true); // 150 minutes offset
      expect(isValid50MinuteSlot("12:20")).toBe(true); // 200 minutes offset
      expect(isValid50MinuteSlot("13:10")).toBe(true); // 250 minutes offset
      expect(isValid50MinuteSlot("14:00")).toBe(true); // 300 minutes offset
      expect(isValid50MinuteSlot("14:50")).toBe(true); // 350 minutes offset
      expect(isValid50MinuteSlot("15:40")).toBe(true); // 400 minutes offset
      expect(isValid50MinuteSlot("16:30")).toBe(true); // 450 minutes offset
      expect(isValid50MinuteSlot("17:20")).toBe(true); // 500 minutes offset
    });

    test("should reject times not in 50-minute intervals", () => {
      expect(isValid50MinuteSlot("09:30")).toBe(false);
      expect(isValid50MinuteSlot("10:00")).toBe(false);
      expect(isValid50MinuteSlot("10:30")).toBe(false);
      expect(isValid50MinuteSlot("11:00")).toBe(false);
      expect(isValid50MinuteSlot("12:00")).toBe(false);
      expect(isValid50MinuteSlot("14:30")).toBe(false);
    });

    test("should reject times before 09:00", () => {
      expect(isValid50MinuteSlot("08:00")).toBe(false);
      expect(isValid50MinuteSlot("08:50")).toBe(false);
    });
  });
});

describe("ID Validation", () => {
  test("should validate positive integers", () => {
    expect(isValidId(1)).toBe(true);
    expect(isValidId("123")).toBe(true);
    expect(isValidId(999)).toBe(true);
  });

  test("should reject invalid IDs", () => {
    expect(isValidId(0)).toBe(false);
    expect(isValidId(-1)).toBe(false);
    expect(isValidId("abc")).toBe(false);
    expect(isValidId(null)).toBe(false);
    expect(isValidId(undefined)).toBe(false);
  });
});

describe("Role Validation", () => {
  test("should validate correct user roles", () => {
    expect(isValidRole("patient")).toBe(true);
    expect(isValidRole("receptionist")).toBe(true);
    expect(isValidRole("lab_tech")).toBe(true);
    expect(isValidRole("health_professional")).toBe(true);
    expect(isValidRole("clinic_admin")).toBe(true);
    expect(isValidRole("system_admin")).toBe(true);
  });

  test("should reject invalid roles", () => {
    expect(isValidRole("admin")).toBe(false);
    expect(isValidRole("doctor")).toBe(false);
    expect(isValidRole("user")).toBe(false);
    expect(isValidRole("")).toBe(false);
  });
});
