import React, {PropsWithChildren} from 'react';

import {ServicesProvider} from '@app/services';
import {StoresProvider} from '@app/stores';
import {SQLiteProvider} from 'expo-sqlite';
import {migrateAllDatabases} from '@app/services/db';

/**
 * `AppProvider` contains providers for stores and services to have access to them inside screens.
 */
export const AppProvider: React.FC<PropsWithChildren<{}>> = ({children}) => {
  return (
    <SQLiteProvider databaseName="toptopsaver.db" onInit={migrateAllDatabases}>
      <StoresProvider>
        <ServicesProvider>{children}</ServicesProvider>
      </StoresProvider>
    </SQLiteProvider>
  );
};
