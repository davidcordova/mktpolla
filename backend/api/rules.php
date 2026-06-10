<?php
// backend/api/rules.php

require_once __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    respondJson(['error' => 'Method not allowed'], 405);
}

respondJson([
    'status' => 'success',
    'rules' => [
        'group_stage' => [
            'title' => 'Fase de Grupos',
            'points' => 1,
            'description' => 'Acierta el resultado 1X2 (Gana A, Empate o Gana B). Colocar marcador es opcional, pero si lo aciertas exacto obtienes +1 punto adicional (Total 2 puntos).'
        ],
        'knockout' => [
            'round_of_32' => [
                'title' => 'Dieciseisavos de Final',
                'points' => 2,
                'description' => 'Acierta el ganador de la llave.'
            ],
            'round_of_16' => [
                'title' => 'Octavos de Final',
                'points' => 5,
                'description' => 'Acierta el ganador de la llave.'
            ],
            'quarters' => [
                'title' => 'Cuartos de Final',
                'points' => 10,
                'description' => 'Acierta el ganador de la llave.'
            ],
            'semis' => [
                'title' => 'Semifinales',
                'points' => 15,
                'description' => 'Acierta el ganador de la llave.'
            ],
            'final' => [
                'title' => 'Final',
                'points' => 25,
                'description' => 'Acierta el ganador de la final.'
            ]
        ],
        'bonuses' => [
            'quarters_qualified' => [
                'title' => 'Clasificado a Cuartos de Final',
                'points' => 10,
                'description' => 'Puntos por cada equipo que pronosticaste que llegaría a Cuartos y clasificó en la vida real.'
            ],
            'semis_qualified' => [
                'title' => 'Clasificado a Semifinales',
                'points' => 15,
                'description' => 'Puntos por cada equipo que pronosticaste que llegaría a Semifinales y clasificó en la vida real.'
            ],
            'finalists' => [
                'title' => 'Finalistas del Mundial',
                'points' => 25,
                'description' => 'Puntos por cada equipo que pronosticaste que llegaría a la Final y clasificó en la vida real.'
            ],
            'champion' => [
                'title' => 'Campeón del Mundo',
                'points' => 50,
                'description' => 'Puntos si aciertas el equipo campeón de la Copa del Mundo 2026.'
            ]
        ]
    ]
]);
