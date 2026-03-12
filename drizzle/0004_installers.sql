-- Migración: Tabla de instaladores + installerId en certificates

-- 1. Eliminar campos de instalador del perfil (ahora es perfil de empresa)
ALTER TABLE `profiles`
  DROP COLUMN IF EXISTS `fullName`,
  DROP COLUMN IF EXISTS `installerNumber`,
  DROP COLUMN IF EXISTS `installerCategory`;

-- Añadir campo email a profiles si no existe
ALTER TABLE `profiles`
  ADD COLUMN IF NOT EXISTS `email` varchar(320);

-- 2. Crear tabla de instaladores
CREATE TABLE IF NOT EXISTS `installers` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `nif` varchar(20),
  `phone` varchar(20),
  `email` varchar(320),
  `installerNumber` varchar(50),
  `installerCategory` varchar(50),
  `signatureUrl` text,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT NOW(),
  `updatedAt` timestamp NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  CONSTRAINT `installers_id` PRIMARY KEY(`id`)
);

-- 3. Añadir installerId a certificates
ALTER TABLE `certificates`
  ADD COLUMN IF NOT EXISTS `installerId` int;
