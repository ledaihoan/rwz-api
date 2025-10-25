-- CreateTable
CREATE TABLE `Country` (
   `id` INT NOT NULL AUTO_INCREMENT,
   `iso_3166_2` CHAR(2) NOT NULL,
   `iso_3166_3` CHAR(3) NOT NULL,
   `name` VARCHAR(100) NOT NULL,
   `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

   UNIQUE INDEX `Country_iso_3166_2_key`(`iso_3166_2`),
   UNIQUE INDEX `Country_iso_3166_3_key`(`iso_3166_3`),
   PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` CHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `countryId` INT NOT NULL,
    `address` TEXT NULL,
    `latitude` DECIMAL(10, 8) NOT NULL DEFAULT 0,
    `longitude` DECIMAL(11, 8) NOT NULL DEFAULT 0,
    `location` POINT NOT NULL DEFAULT (ST_GeomFromText('POINT(0 0)', 4326)),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_countryId_idx`(`countryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Store` (
     `id` CHAR(36) NOT NULL,
     `name` VARCHAR(255) NOT NULL,
     `englishName` VARCHAR(255) NOT NULL,
     `serviceType` VARCHAR(100) NOT NULL,
     `countryId` INT NOT NULL,
     `latitude` DECIMAL(10, 8) NOT NULL,
     `longitude` DECIMAL(11, 8) NOT NULL,
     `location` POINT NOT NULL DEFAULT (ST_GeomFromText('POINT(0 0)', 4326)),
     `address` TEXT NULL,
     `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

     INDEX `Store_countryId_idx`(`countryId`),
     INDEX `Store_serviceType_idx`(`serviceType`),
     FULLTEXT INDEX `Store_name_english_idx`(`englishName`),
     PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Favorite` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `storeId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Favorite_userId_idx`(`userId`),
    UNIQUE INDEX `Favorite_userId_storeId_key`(`userId`, `storeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Store` ADD CONSTRAINT `Store_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorite` ADD CONSTRAINT `Favorite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorite` ADD CONSTRAINT `Favorite_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;