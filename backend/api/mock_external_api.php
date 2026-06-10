<?php
// backend/api/mock_external_api.php

header('Content-Type: application/json; charset=utf-8');

$mockData = [
    "tournament" => "Copa Mundial de la FIFA 2026",
    "last_updated" => date('Y-m-d H:i:s'),
    "matches" => [
        // Grupo A
        [
            "stage" => "GROUPS",
            "team_a" => "USA",
            "team_b" => "PAN",
            "team_a_score" => 2,
            "team_b_score" => 1,
            "finished" => true
        ],
        [
            "stage" => "GROUPS",
            "team_a" => "JAM",
            "team_b" => "CIV",
            "team_a_score" => 1,
            "team_b_score" => 1,
            "finished" => true
        ],
        // Grupo B
        [
            "stage" => "GROUPS",
            "team_a" => "MEX",
            "team_b" => "ECU",
            "team_a_score" => 3,
            "team_b_score" => 2,
            "finished" => true
        ],
        [
            "stage" => "GROUPS",
            "team_a" => "AUS",
            "team_b" => "NGA",
            "team_a_score" => 0,
            "team_b_score" => 2,
            "finished" => true
        ]
    ]
];

echo json_encode($mockData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

