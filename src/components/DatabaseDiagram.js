export function DatabaseDiagram() {
    return `
        <div class="database-diagram">

            <div class="database-diagram__title">
                Структура базы данных
            </div>

            <div class="database-diagram__canvas">

                <!-- usersPersonalData -->

                <div class="db-table db-table--personal">
                    <div class="db-table__header">
                        usersPersonalData
                    </div>

                    <div class="db-table__body">

                        <div class="db-field db-field--primary">
                            <span class="db-field__key">🔑</span>
                            <span class="db-field__name">id</span>
                            <span class="db-field__type">INTEGER</span>
                        </div>

                        <div class="db-field">
                            <span class="db-field__key"></span>
                            <span class="db-field__name">firstName</span>
                            <span class="db-field__type">VARCHAR(100)</span>
                        </div>

                        <div class="db-field">
                            <span class="db-field__key"></span>
                            <span class="db-field__name">lastName</span>
                            <span class="db-field__type">VARCHAR(100)</span>
                        </div>

                        <div class="db-field">
                            <span class="db-field__key"></span>
                            <span class="db-field__name">gender</span>
                            <span class="db-field__type">VARCHAR(20)</span>
                        </div>

                        <div class="db-field">
                            <span class="db-field__key"></span>
                            <span class="db-field__name">birthDate</span>
                            <span class="db-field__type">DATE</span>
                        </div>

                        <div class="db-field">
                            <span class="db-field__key"></span>
                            <span class="db-field__name">email</span>
                            <span class="db-field__type">VARCHAR(255)</span>
                        </div>

                    </div>
                </div>


                <!-- userPhones -->

                <div class="db-table db-table--phones">
                    <div class="db-table__header">
                        userPhones
                    </div>

                    <div class="db-table__body">

                        <div class="db-field db-field--primary">
                            <span class="db-field__key">🔑</span>
                            <span class="db-field__name">id</span>
                            <span class="db-field__type">INTEGER</span>
                        </div>

                        <div class="db-field db-field--foreign">
                            <span class="db-field__key">🔗</span>
                            <span class="db-field__name">userId</span>
                            <span class="db-field__type">INTEGER</span>
                        </div>

                        <div class="db-field">
                            <span class="db-field__key"></span>
                            <span class="db-field__name">phone</span>
                            <span class="db-field__type">VARCHAR(30)</span>
                        </div>

                        <div class="db-field">
                            <span class="db-field__key"></span>
                            <span class="db-field__name">phoneType</span>
                            <span class="db-field__type">VARCHAR(20)</span>
                        </div>

                        <div class="db-field">
                            <span class="db-field__key"></span>
                            <span class="db-field__name">isPrimary</span>
                            <span class="db-field__type">BOOLEAN</span>
                        </div>

                    </div>
                </div>


                <!-- userAddress -->

                <div class="db-table db-table--address">
                    <div class="db-table__header">
                        userAddress
                    </div>

                    <div class="db-table__body">

                        <div class="db-field db-field--primary">
                            <span class="db-field__key">🔑</span>
                            <span class="db-field__name">id</span>
                            <span class="db-field__type">INTEGER</span>
                        </div>

                        <div class="db-field db-field--foreign">
                            <span class="db-field__key">🔗</span>
                            <span class="db-field__name">userId</span>
                            <span class="db-field__type">INTEGER</span>
                        </div>

                        <div class="db-field">
                            <span class="db-field__key"></span>
                            <span class="db-field__name">country</span>
                            <span class="db-field__type">VARCHAR(100)</span>
                        </div>

                        <div class="db-field">
                            <span class="db-field__key"></span>
                            <span class="db-field__name">city</span>
                            <span class="db-field__type">VARCHAR(100)</span>
                        </div>

                        <div class="db-field">
                            <span class="db-field__key"></span>
                            <span class="db-field__name">street</span>
                            <span class="db-field__type">VARCHAR(150)</span>
                        </div>

                        <div class="db-field">
                            <span class="db-field__key"></span>
                            <span class="db-field__name">house</span>
                            <span class="db-field__type">VARCHAR(20)</span>
                        </div>

                        <div class="db-field">
                            <span class="db-field__key"></span>
                            <span class="db-field__name">apartment</span>
                            <span class="db-field__type">VARCHAR(20)</span>
                        </div>

                        <div class="db-field">
                            <span class="db-field__key"></span>
                            <span class="db-field__name">postalCode</span>
                            <span class="db-field__type">VARCHAR(20)</span>
                        </div>

                    </div>
                </div>


                <!-- mapUserDevice -->

                <div class="db-table db-table--mapping">
                    <div class="db-table__header">
                        mapUserDevice
                    </div>

                    <div class="db-table__body">

                        <div class="db-field db-field--primary">
                            <span class="db-field__key">🔑</span>
                            <span class="db-field__name">id</span>
                            <span class="db-field__type">INTEGER</span>
                        </div>

                        <div class="db-field db-field--foreign">
                            <span class="db-field__key">🔗</span>
                            <span class="db-field__name">userId</span>
                            <span class="db-field__type">INTEGER</span>
                        </div>

                        <div class="db-field db-field--foreign">
                            <span class="db-field__key">🔗</span>
                            <span class="db-field__name">deviceId</span>
                            <span class="db-field__type">INTEGER</span>
                        </div>

                    </div>
                </div>


                <!-- Device -->

                <div class="db-table db-table--device">
                    <div class="db-table__header">
                        Device
                    </div>

                    <div class="db-table__body">

                        <div class="db-field db-field--primary">
                            <span class="db-field__key">🔑</span>
                            <span class="db-field__name">id</span>
                            <span class="db-field__type">INTEGER</span>
                        </div>

                        <div class="db-field">
                            <span class="db-field__key"></span>
                            <span class="db-field__name">name</span>
                            <span class="db-field__type">VARCHAR(150)</span>
                        </div>

                        <div class="db-field">
                            <span class="db-field__key"></span>
                            <span class="db-field__name">operatingSystem</span>
                            <span class="db-field__type">VARCHAR(100)</span>
                        </div>

                        <div class="db-field">
                            <span class="db-field__key"></span>
                            <span class="db-field__name">inventoryNumber</span>
                            <span class="db-field__type">VARCHAR(50)</span>
                        </div>

                    </div>
                </div>


                <!-- Relationships -->

                <div class="db-relationship db-relationship--personal-phone">
                    <div class="db-relationship__line"></div>

                    <div class="db-relationship__label">
                        1 : N
                    </div>
                </div>

                <div class="db-relationship db-relationship--personal-address">
                    <div class="db-relationship__line"></div>

                    <div class="db-relationship__label">
                        1 : N
                    </div>
                </div>

                <div class="db-relationship db-relationship--personal-map">
                    <div class="db-relationship__line"></div>

                    <div class="db-relationship__label">
                        1 : N
                    </div>
                </div>

                <div class="db-relationship db-relationship--map-device">
                    <div class="db-relationship__line"></div>

                    <div class="db-relationship__label">
                        N : 1
                    </div>
                </div>


                <!-- Legend -->

                <div class="db-legend">

                    <div class="db-legend__item">
                        <span>🔑</span>
                        <span>Primary Key</span>
                    </div>

                    <div class="db-legend__item">
                        <span>🔗</span>
                        <span>Foreign Key</span>
                    </div>

                    <div class="db-legend__item">
                        <span>1 : N</span>
                        <span>Один ко многим</span>
                    </div>

                </div>

            </div>
        </div>
    `;
}