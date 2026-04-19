<?php
header('Content-Type: text/plain');
error_reporting(E_ALL);
ini_set('display_errors', 1);

$host = 'localhost';
$dbname = 'joalacom_joala';
$user = 'joalacom_joala';
$pass = 'joala@2025@';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Connected to database.\n\n";
    
    // Check if funnel_leads table exists
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('funnel_leads', $tables)) {
        echo "Creating funnel_leads table...\n";
        $pdo->exec("CREATE TABLE IF NOT EXISTS `funnel_leads` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `funnel_id` bigint(20) UNSIGNED NULL,
            `lead_id` bigint(20) UNSIGNED NULL,
            `stage_id` bigint(20) UNSIGNED NULL,
            `email` varchar(255) NULL,
            `source` varchar(255) NULL,
            `converted` tinyint(1) DEFAULT 0,
            `entered_at` datetime NULL,
            `exited_at` datetime NULL,
            `score` int DEFAULT 0,
            `last_activity` datetime NULL,
            `times_visited` int DEFAULT 0,
            `pages_viewed` int DEFAULT 0,
            `email_opens` int DEFAULT 0,
            PRIMARY KEY (`id`),
            KEY `funnel_id` (`funnel_id`),
            KEY `lead_id` (`lead_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        echo "Created funnel_leads table.\n";
    } else {
        echo "funnel_leads table already exists.\n";
    }
    
    // Add columns to funnels table
    echo "\nAdding columns to funnels table...\n";
    
    $funnelColumns = [
        'order_bumps' => 'JSON NULL',
        'refund_policy' => "VARCHAR(50) DEFAULT 'days'",
        'refund_period_days' => 'INT DEFAULT 30',
        'affiliate_enabled' => 'TINYINT(1) DEFAULT 0',
        'affiliate_commission' => 'DECIMAL(5,2) DEFAULT 20.00',
        'affiliate_cookie_days' => 'INT DEFAULT 30',
        'score_per_page' => 'INT DEFAULT 5',
        'score_per_email' => 'INT DEFAULT 10',
        'score_per_checkout' => 'INT DEFAULT 20',
        'score_hot_threshold' => 'INT DEFAULT 100',
    ];
    
    foreach ($funnelColumns as $col => $def) {
        try {
            $pdo->exec("ALTER TABLE `funnels` ADD COLUMN `$col` $def");
            echo "Added $col\n";
        } catch (PDOException $e) {
            if (str_contains($e->getMessage(), 'Duplicate')) {
                echo "Column $col already exists, skipping.\n";
            } else {
                echo "Error adding $col: " . $e->getMessage() . "\n";
            }
        }
    }
    
    // Add columns to funnel_leads table
    echo "\nAdding columns to funnel_leads table...\n";
    
    $leadColumns = [
        'score' => 'INT DEFAULT 0',
        'last_activity' => 'DATETIME NULL',
        'times_visited' => 'INT DEFAULT 0',
        'pages_viewed' => 'INT DEFAULT 0',
        'email_opens' => 'INT DEFAULT 0',
    ];
    
    foreach ($leadColumns as $col => $def) {
        try {
            $pdo->exec("ALTER TABLE `funnel_leads` ADD COLUMN `$col` $def");
            echo "Added $col\n";
        } catch (PDOException $e) {
            if (str_contains($e->getMessage(), 'Duplicate')) {
                echo "Column $col already exists, skipping.\n";
            } else {
                echo "Error adding $col: " . $e->getMessage() . "\n";
            }
        }
    }
    
    echo "\nDone! Migration complete.\n";
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
}