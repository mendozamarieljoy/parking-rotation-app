WITH configured_holidays ("id", "name", "month", "day") AS (
    VALUES
        ('holiday-seed-2026-01-01', 'New Year''s Day', 1, 1),
        ('holiday-seed-2026-04-09', 'Araw ng Kagitingan', 4, 9),
        ('holiday-seed-2026-05-01', 'Labor Day', 5, 1),
        ('holiday-seed-2026-05-27', 'Eid''l Adha (Feast of Sacrifice)', 5, 27),
        ('holiday-seed-2026-06-12', 'Independence Day', 6, 12),
        ('holiday-seed-2026-08-21', 'Ninoy Aquino Day', 8, 21),
        ('holiday-seed-2026-08-31', 'National Heroes Day', 8, 31),
        ('holiday-seed-2026-11-02', 'All Soul''s day', 11, 2),
        ('holiday-seed-2026-11-16', '49th ASEAN Summit', 11, 16),
        ('holiday-seed-2026-11-17', '49th ASEAN Summit', 11, 17),
        ('holiday-seed-2026-11-18', '49th ASEAN Summit', 11, 18),
        ('holiday-seed-2026-12-24', 'Christmas Eve', 12, 24),
        ('holiday-seed-2026-12-25', 'Christmas Day', 12, 25),
        ('holiday-seed-2026-12-30', 'Rizal Day', 12, 30),
        ('holiday-seed-2026-12-31', 'New Year''s Eve', 12, 31)
)
INSERT INTO "Holiday" ("id", "name", "type", "date", "month", "day", "updatedAt")
SELECT configured."id", configured."name", 'ANNUAL'::"HolidayType", NULL,
       configured."month", configured."day", CURRENT_TIMESTAMP
FROM configured_holidays AS configured
WHERE NOT EXISTS (
    SELECT 1
    FROM "Holiday" AS existing
    WHERE existing."type" = 'ANNUAL'::"HolidayType"
      AND existing."name" = configured."name"
      AND existing."month" = configured."month"
      AND existing."day" = configured."day"
);
