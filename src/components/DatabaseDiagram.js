export function DatabaseDiagram() {
    return `
        <div class="database-diagram-wrapper">

        


            <div class="database-diagram">

                <div class="database-diagram__title">
                    Структура базы данных
                </div>

                <div class="database-diagram__subtitle">
                    Пять таблиц, из которых мы позже соберём единую API-модель пользователя
                </div>

                <div class="mermaid">
---
config:
  theme: base
  er:
    layoutDirection: LR
    minEntityWidth: 190
    minEntityHeight: 55
    entityPadding: 12
    nodeSpacing: 90
    rankSpacing: 80
    fontSize: 13
    fill: "#ffffff"
    stroke: "#cbd5e1"
---
erDiagram
    direction LR

    usersPersonalData ||--o{ userPhones : "1:N"
    usersPersonalData ||--o{ userAddress : "1:N"
    usersPersonalData ||--o{ mapUserDevice : "1:N"
    mapUserDevice }o--|| Device : "N:1"

    usersPersonalData {
        INTEGER id PK
        VARCHAR_100 firstName
        VARCHAR_100 lastName
        VARCHAR_20 gender
        DATE birthDate
        VARCHAR_255 email
    }

    userPhones {
        INTEGER id PK
        INTEGER userId FK
        VARCHAR_30 phone
        VARCHAR_20 phoneType
        BOOLEAN isPrimary
    }

    userAddress {
        INTEGER id PK
        INTEGER userId FK
        VARCHAR_100 country
        VARCHAR_100 city
        VARCHAR_150 street
        VARCHAR_20 house
        VARCHAR_20 apartment
        VARCHAR_20 postalCode
    }

    mapUserDevice {
        INTEGER id PK
        INTEGER userId FK
        INTEGER deviceId FK
    }

    Device {
        INTEGER id PK
        VARCHAR_150 name
        VARCHAR_100 operatingSystem
        VARCHAR_50 inventoryNumber
    }
                </div>

                <div class="database-diagram__legend">

                    <div class="database-diagram__legend-item">
                        <strong>PK</strong>
                        <span>Primary Key</span>
                    </div>

                    <div class="database-diagram__legend-item">
                        <strong>FK</strong>
                        <span>Foreign Key</span>
                    </div>

                    <div class="database-diagram__legend-item">
                        <strong>1:N</strong>
                        <span>Один ко многим</span>
                    </div>

                </div>

            </div>

        </div>
    `;
}