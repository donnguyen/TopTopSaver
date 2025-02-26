import React, {PropsWithChildren} from 'react';

import {ServicesProvider} from '@app/services';
import {StoresProvider} from '@app/stores';
import {SQLiteProvider} from 'expo-sqlite';
import {migrateDbIfNeeded} from '@app/services/db/photo';

/**
 * `AppProvider` contains providers for stores and services to have access to them inside screens.
 */
export const AppProvider: React.FC<PropsWithChildren<{}>> = ({children}) => {
  return (
    <SQLiteProvider databaseName="idphotos.db" onInit={migrateDbIfNeeded}>
      <StoresProvider>
        <ServicesProvider>{children}</ServicesProvider>
      </StoresProvider>
    </SQLiteProvider>
  );
};
