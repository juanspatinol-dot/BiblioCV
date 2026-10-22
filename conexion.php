<?php
function conectar(bool $conBD = true): PDO
{
    $host = 'localhost';
    $user = 'root';
    $pass = '123456';
    $bd   = 'bibliocv';

    $dsn = "mysql:host=$host;" . ($conBD ? "dbname=$bd;" : "") . "charset=utf8mb4";

    return new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
}