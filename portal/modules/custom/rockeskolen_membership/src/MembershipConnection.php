<?php

declare(strict_types=1);

namespace Drupal\rockeskolen_membership;

use PDO;
use PDOException;
use Psr\Log\LoggerInterface;
use RuntimeException;

/**
 * Creates a separate connection to the shared membership database.
 */
final class MembershipConnection {

  private ?PDO $connection = NULL;

  public function __construct(
    private readonly LoggerInterface $logger,
  ) {}

  /**
   * Returns the membership database connection.
   */
  public function get(): PDO {
    if ($this->connection instanceof PDO) {
      return $this->connection;
    }

    $localConfig = dirname(DRUPAL_ROOT) . '/members/config.local.php';
    if (is_file($localConfig)) {
      require_once $localConfig;
    }

    $host = getenv('CHORDLINK_DB_HOST') ?: '';
    $database = getenv('CHORDLINK_DB_NAME') ?: '';
    $username = getenv('CHORDLINK_DB_USER') ?: '';
    $password = getenv('CHORDLINK_DB_PASS') ?: '';
    if ($host === '' || $database === '' || $username === '') {
      throw new RuntimeException('Membership database configuration is unavailable.');
    }

    try {
      $this->connection = new PDO(
        "mysql:host={$host};dbname={$database};charset=utf8mb4",
        $username,
        $password,
        [
          PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
          PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
          PDO::ATTR_EMULATE_PREPARES => FALSE,
        ],
      );
    }
    catch (PDOException $exception) {
      $this->logger->error('Membership database connection failed.');
      throw new RuntimeException('Membership database is unavailable.', 0, $exception);
    }

    return $this->connection;
  }

}
