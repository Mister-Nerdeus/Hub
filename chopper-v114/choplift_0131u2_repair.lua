-- Chopper Game v1.14 research-only Choplifter 8751 repair bridge.
--
-- Historical authority:
--   MAME mame0131u2 DRIVER_INIT(choplift)
--
-- This reproduces the three repairs MAME applied to the historical BAD_DUMP:
--   0x0100 D5 -> 55
--   0x027B F2 -> FB
--   0x02FF    -> F6
--
-- It patches only the loaded :mcu memory region and then requests one soft
-- reset.  It never creates a canonical MCU and must never be treated as
-- VERIFIED source evidence.

local LANE = "NONCANONICAL_HISTORICAL_MAME_REPAIR"
local applied = false
local reset_requested = false

local function hex(v)
    return string.format("0x%02X", v)
end

local function fail(msg)
    emu.print_error("[Chopper MCU repair] FAIL: " .. msg)
    applied = true -- fail closed: never keep retrying unknown input
end

local function apply_repair()
    if applied then
        return
    end

    local regions = manager.machine.memory.regions
    local mcu = regions[":mcu"]
    if not mcu then
        fail("no :mcu region; this bridge is only for the protected choplift research lane")
        return
    end
    if mcu.size ~= 0x1000 then
        fail(string.format("unexpected :mcu size 0x%X; expected 0x1000", mcu.size))
        return
    end

    local b100 = mcu:read_u8(0x0100)
    local b27b = mcu:read_u8(0x027B)
    local b2ff = mcu:read_u8(0x02FF)

    -- Already repaired in this process.
    if b100 == 0x55 and b27b == 0xFB and b2ff == 0xF6 then
        emu.print_info("[Chopper MCU repair] historical repair already present; lane=" .. LANE)
        applied = true
        return
    end

    -- The first two bytes are explicitly documented by historical MAME.
    -- Refuse to touch an unknown or canonical-looking MCU image.
    if b100 ~= 0xD5 or b27b ~= 0xF2 then
        fail(
            "repair-site fingerprint mismatch: "
            .. "0x0100=" .. hex(b100)
            .. " 0x027B=" .. hex(b27b)
            .. "; refusing to patch unknown source"
        )
        return
    end

    mcu:write_u8(0x0100, 0x55)
    mcu:write_u8(0x027B, 0xFB)
    mcu:write_u8(0x02FF, 0xF6)

    if mcu:read_u8(0x0100) ~= 0x55
        or mcu:read_u8(0x027B) ~= 0xFB
        or mcu:read_u8(0x02FF) ~= 0xF6 then
        fail("post-write verification failed")
        return
    end

    emu.print_info(
        string.format(
            "[Chopper MCU repair] applied historical MAME repair; "
            .. "old[02FF]=0x%02X; lane=%s; promotion_eligible=false",
            b2ff,
            LANE
        )
    )

    applied = true
    if not reset_requested then
        reset_requested = true
        manager.machine:soft_reset()
    end
end

-- An autoboot script is evaluated after machine construction.  Apply as soon
-- as scripting runs; the soft reset restarts emulation with the repaired
-- in-memory MCU region.  The periodic notifier is a fallback in case the
-- region is not yet visible at first evaluation.
apply_repair()
emu.register_periodic(function()
    if not applied then
        apply_repair()
    end
end)
