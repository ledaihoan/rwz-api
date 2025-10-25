-- Add SPATIAL indexes
ALTER TABLE `User` ADD SPATIAL INDEX `idx_user_location` (`location`);
ALTER TABLE `Store` ADD SPATIAL INDEX `idx_store_location` (`location`);

-- Trigger for User insert (FIXED: latitude first, then longitude)
CREATE TRIGGER `user_location_insert`
    BEFORE INSERT ON `User`
    FOR EACH ROW
    SET NEW.location = ST_GeomFromText(CONCAT('POINT(', NEW.latitude, ' ', NEW.longitude, ')'), 4326);

-- Trigger for User update (FIXED: latitude first, then longitude)
CREATE TRIGGER `user_location_update`
    BEFORE UPDATE ON `User`
    FOR EACH ROW
    SET NEW.location = ST_GeomFromText(CONCAT('POINT(', NEW.latitude, ' ', NEW.longitude, ')'), 4326);

-- Trigger for Store insert (FIXED: latitude first, then longitude)
CREATE TRIGGER `store_location_insert`
    BEFORE INSERT ON `Store`
    FOR EACH ROW
    SET NEW.location = ST_GeomFromText(CONCAT('POINT(', NEW.latitude, ' ', NEW.longitude, ')'), 4326);

-- Trigger for Store update (FIXED: latitude first, then longitude)
CREATE TRIGGER `store_location_update`
    BEFORE UPDATE ON `Store`
    FOR EACH ROW
    SET NEW.location = ST_GeomFromText(CONCAT('POINT(', NEW.latitude, ' ', NEW.longitude, ')'), 4326);