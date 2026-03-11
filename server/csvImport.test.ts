import { describe, it, expect } from "vitest";

// ─── Inline copy of the RFC 4180 parser from crm.ts ──────────────────────────

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') { cell += '"'; i++; }
        else { inQuotes = false; }
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(cell); cell = "";
      } else if (ch === "\n") {
        row.push(cell); cell = "";
        if (row.some((c) => c !== "")) rows.push(row);
        row = [];
      } else {
        cell += ch;
      }
    }
  }
  row.push(cell);
  if (row.some((c) => c !== "")) rows.push(row);
  return rows;
}

// ─── Header alias map (inline copy) ──────────────────────────────────────────

const ALIASES: Record<string, string> = {
  "email": "email", "e-mail": "email",
  "first name": "firstName", "firstname": "firstName", "first_name": "firstName",
  "last name": "lastName", "lastname": "lastName", "last_name": "lastName",
  "phone": "phone", "mobile": "phone", "telephone": "phone",
  "address": "address", "city": "city", "town": "city",
  "country": "country",
  "postal code": "postalCode", "postalcode": "postalCode", "postal_code": "postalCode",
  "postcode": "postalCode", "zip": "postalCode",
  "segment": "segment", "status": "status", "source": "source",
  "notes": "notes", "note": "notes",
};

function normaliseHeaders(raw: string[]): string[] {
  return raw.map((h) => ALIASES[h.trim().toLowerCase()] ?? h.trim().toLowerCase());
}

// ─── RFC 4180 Parser Tests ────────────────────────────────────────────────────

describe("CSV Parser - Basic parsing", () => {
  it("should parse a simple two-column CSV", () => {
    const rows = parseCSV("Email,Name\njane@test.com,Jane");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual(["Email", "Name"]);
    expect(rows[1]).toEqual(["jane@test.com", "Jane"]);
  });

  it("should handle Windows CRLF line endings", () => {
    const rows = parseCSV("Email,Name\r\njane@test.com,Jane\r\nbob@test.com,Bob");
    expect(rows).toHaveLength(3);
    expect(rows[1][0]).toBe("jane@test.com");
    expect(rows[2][0]).toBe("bob@test.com");
  });

  it("should handle old Mac CR line endings", () => {
    const rows = parseCSV("Email,Name\rjane@test.com,Jane");
    expect(rows).toHaveLength(2);
    expect(rows[1][0]).toBe("jane@test.com");
  });

  it("should return empty array for empty input", () => {
    const rows = parseCSV("");
    expect(rows).toHaveLength(0);
  });

  it("should skip blank lines", () => {
    const rows = parseCSV("Email,Name\n\njane@test.com,Jane\n\n");
    expect(rows).toHaveLength(2);
  });
});

describe("CSV Parser - Quoted fields", () => {
  it("should parse a quoted field containing a comma", () => {
    const rows = parseCSV(`Email,Address\njane@test.com,"123 High Street, London"`);
    expect(rows[1][1]).toBe("123 High Street, London");
  });

  it("should parse a quoted field containing a newline", () => {
    const rows = parseCSV(`Email,Notes\njane@test.com,"Line one\nLine two"`);
    expect(rows[1][1]).toBe("Line one\nLine two");
  });

  it("should handle escaped double quotes inside quoted fields", () => {
    const rows = parseCSV(`Email,Notes\njane@test.com,"She said ""hello"""`);
    expect(rows[1][1]).toBe(`She said "hello"`);
  });

  it("should handle quoted fields with no special characters", () => {
    const rows = parseCSV(`"Email","Name"\n"jane@test.com","Jane Smith"`);
    expect(rows[0]).toEqual(["Email", "Name"]);
    expect(rows[1]).toEqual(["jane@test.com", "Jane Smith"]);
  });

  it("should handle mixed quoted and unquoted fields in the same row", () => {
    const rows = parseCSV(`Email,Name,Notes\njane@test.com,Jane,"Has a comma, here"`);
    expect(rows[1]).toHaveLength(3);
    expect(rows[1][2]).toBe("Has a comma, here");
  });

  it("should handle empty quoted fields", () => {
    const rows = parseCSV(`Email,Name\njane@test.com,""`);
    expect(rows[1][1]).toBe("");
  });
});

describe("CSV Parser - Edge cases", () => {
  it("should handle a single column CSV", () => {
    const rows = parseCSV("Email\njane@test.com\nbob@test.com");
    expect(rows).toHaveLength(3);
    expect(rows[1][0]).toBe("jane@test.com");
  });

  it("should handle trailing comma (empty last field)", () => {
    const rows = parseCSV("Email,Name,\njane@test.com,Jane,");
    expect(rows[1]).toHaveLength(3);
    expect(rows[1][2]).toBe("");
  });

  it("should handle many columns", () => {
    const header = "Email,First Name,Last Name,Phone,Address,City,Country,Postal Code,Segment,Source,Notes";
    const data   = "jane@test.com,Jane,Smith,+44 7700,123 St,London,UK,SW1A 1AA,lead,instagram,Met at event";
    const rows = parseCSV(`${header}\n${data}`);
    expect(rows[1]).toHaveLength(11);
    expect(rows[1][0]).toBe("jane@test.com");
    expect(rows[1][10]).toBe("Met at event");
  });
});

// ─── Header Alias Tests ───────────────────────────────────────────────────────

describe("CSV Import - Header aliases", () => {
  it("should map 'email' to 'email'", () => {
    const headers = normaliseHeaders(["email"]);
    expect(headers[0]).toBe("email");
  });

  it("should map 'e-mail' to 'email'", () => {
    const headers = normaliseHeaders(["e-mail"]);
    expect(headers[0]).toBe("email");
  });

  it("should map 'First Name' (mixed case) to 'firstName'", () => {
    const headers = normaliseHeaders(["First Name"]);
    expect(headers[0]).toBe("firstName");
  });

  it("should map 'firstname' to 'firstName'", () => {
    const headers = normaliseHeaders(["firstname"]);
    expect(headers[0]).toBe("firstName");
  });

  it("should map 'first_name' to 'firstName'", () => {
    const headers = normaliseHeaders(["first_name"]);
    expect(headers[0]).toBe("firstName");
  });

  it("should map 'Last Name' to 'lastName'", () => {
    const headers = normaliseHeaders(["Last Name"]);
    expect(headers[0]).toBe("lastName");
  });

  it("should map 'mobile' to 'phone'", () => {
    const headers = normaliseHeaders(["mobile"]);
    expect(headers[0]).toBe("phone");
  });

  it("should map 'telephone' to 'phone'", () => {
    const headers = normaliseHeaders(["telephone"]);
    expect(headers[0]).toBe("phone");
  });

  it("should map 'town' to 'city'", () => {
    const headers = normaliseHeaders(["town"]);
    expect(headers[0]).toBe("city");
  });

  it("should map 'postcode' to 'postalCode'", () => {
    const headers = normaliseHeaders(["postcode"]);
    expect(headers[0]).toBe("postalCode");
  });

  it("should map 'zip' to 'postalCode'", () => {
    const headers = normaliseHeaders(["zip"]);
    expect(headers[0]).toBe("postalCode");
  });

  it("should map 'note' to 'notes'", () => {
    const headers = normaliseHeaders(["note"]);
    expect(headers[0]).toBe("notes");
  });

  it("should preserve unknown headers unchanged (lowercased)", () => {
    const headers = normaliseHeaders(["CustomField"]);
    expect(headers[0]).toBe("customfield");
  });

  it("should handle mixed-case standard headers", () => {
    const headers = normaliseHeaders(["EMAIL", "FIRST NAME", "LAST NAME"]);
    expect(headers).toEqual(["email", "firstName", "lastName"]);
  });
});

// ─── Validation Logic Tests ───────────────────────────────────────────────────

describe("CSV Import - Email validation", () => {
  const validEmails = [
    "jane@example.com",
    "jane.smith@example.co.uk",
    "jane+tag@example.org",
    "jane123@sub.domain.com",
  ];

  const invalidEmails = [
    "",
    "not-an-email",
    "@nodomain.com",
    "noatsign.com",
    "spaces in@email.com",
  ];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  validEmails.forEach((email) => {
    it(`should accept valid email: ${email}`, () => {
      expect(emailRegex.test(email)).toBe(true);
    });
  });

  invalidEmails.forEach((email) => {
    it(`should reject invalid email: "${email}"`, () => {
      expect(emailRegex.test(email)).toBe(false);
    });
  });
});

describe("CSV Import - Segment validation", () => {
  const VALID_SEGMENTS = new Set(["lead", "customer", "vip", "inactive"]);

  it("should accept 'lead' as a valid segment", () => {
    expect(VALID_SEGMENTS.has("lead")).toBe(true);
  });

  it("should accept 'customer' as a valid segment", () => {
    expect(VALID_SEGMENTS.has("customer")).toBe(true);
  });

  it("should accept 'vip' as a valid segment", () => {
    expect(VALID_SEGMENTS.has("vip")).toBe(true);
  });

  it("should accept 'inactive' as a valid segment", () => {
    expect(VALID_SEGMENTS.has("inactive")).toBe(true);
  });

  it("should fall back to 'lead' for unknown segment values", () => {
    const rawSegment = "prospect";
    const segment = VALID_SEGMENTS.has(rawSegment) ? rawSegment : "lead";
    expect(segment).toBe("lead");
  });

  it("should fall back to 'lead' for empty segment", () => {
    const rawSegment = "";
    const segment = VALID_SEGMENTS.has(rawSegment) ? rawSegment : "lead";
    expect(segment).toBe("lead");
  });
});

// ─── CSV Export Tests ─────────────────────────────────────────────────────────

describe("CSV Export - quoteCell", () => {
  const quoteCell = (val: string | number | null | undefined): string => {
    const str = val == null ? "" : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  it("should wrap plain strings in double quotes", () => {
    expect(quoteCell("hello")).toBe('"hello"');
  });

  it("should escape embedded double quotes", () => {
    expect(quoteCell('say "hi"')).toBe('"say ""hi"""');
  });

  it("should handle strings with commas", () => {
    expect(quoteCell("London, UK")).toBe('"London, UK"');
  });

  it("should handle strings with newlines", () => {
    expect(quoteCell("line1\nline2")).toBe('"line1\nline2"');
  });

  it("should handle null values as empty string", () => {
    expect(quoteCell(null)).toBe('""');
  });

  it("should handle undefined values as empty string", () => {
    expect(quoteCell(undefined)).toBe('""');
  });

  it("should handle numbers", () => {
    expect(quoteCell(42)).toBe('"42"');
  });

  it("should handle empty string", () => {
    expect(quoteCell("")).toBe('""');
  });
});

describe("CSV Export - round-trip", () => {
  it("should produce parseable CSV that round-trips correctly", () => {
    const quoteCell = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const headers = ["Email", "First Name", "Last Name", "Notes"];
    const data = [
      ["jane@test.com", "Jane", "Smith", "Loves salsa, bachata"],
      ["bob@test.com", "Bob", "Jones", 'Said "great class!"'],
      ["multi@test.com", "Multi", "Line", "Line1\nLine2"],
    ];
    const csv = [
      headers.map(quoteCell).join(","),
      ...data.map((row) => row.map(quoteCell).join(",")),
    ].join("\r\n");

    const parsed = parseCSV(csv);
    expect(parsed).toHaveLength(4); // header + 3 rows
    expect(parsed[0]).toEqual(headers);
    expect(parsed[1][3]).toBe("Loves salsa, bachata");
    expect(parsed[2][3]).toBe('Said "great class!"');
    expect(parsed[3][3]).toBe("Line1\nLine2");
  });
});
