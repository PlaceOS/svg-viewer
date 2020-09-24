# TypeScript PlaceOS Library

This library is a Typescript interface to PlaceOS

## Compilation

You can build the library from source after installing the dependencies with the command

`npm run build`

## Usage

API docs can be found [here](https://placeos.github.io/ts-client)

You can install the PlaceOS Typescript client with the npm command

`npm install --save-dev @placeos/ts-client`

Before using PlaceOS it will need to be initialised.

```typescript
import { setup } from '@placeos/ts-client/auth';

setup(config).then(() => doAfterAuthInitialised());
```

The setup method returns a promise that resolves after the auth flow has completed.
The setup method takes a `config` object with the following properties

| Property       | Description                                             | Optional | Type                   | Example                   |
| -------------- | ------------------------------------------------------- | -------- | ---------------------- | ------------------------- |
| `host`         | Host name and port of the PlaceOS server                | Yes      | `string`               | `"dev.placeos.com:8080"`  |
| `mock`         | Whether to initialise PlaceOS with mock services        | Yes      | `boolean`              | `true`                    |
| `auth_uri`     | URI for authorising users session                       | No       | `string`               | `"/auth/oauth/authorize"` |
| `token_uri`    | URI for generating new auth tokens                      | No       | `string`               | `"/auth/token"`           |
| `redirect_uri` | URI to redirect user to after authorising session       | No       | `string`               | `"/oauth-resp.html"`      |
| `scope`        | Scope of the user permissions needed by the application | No       | `string`               | `"admin"`                 |
| `storage`      | Browser storage to use for storing user credentials     | Yes      | `"local" | "session"`  |                           |
| `handle_login` | Whether PlaceOS should handle user login                | Yes      | `boolean`              | `true`                    |
| `use_iframe`   | Use iFrame for authorization of application             | Yes      | `boolean`              | `false`                   |


### Websocket API

`PlaceOS` exposes a websocket API through the `realtime` entrypoint.

The `realtime` entrypoint to provides methods for real-time interaction with modules running on PlaceOS. It provides an interface to build efficient, responsive user interfaces, monitoring systems and other extensions which require live, two-way or asynchronous interaction.

Once PlaceOS has initialised you can listen to values on modules

```typescript
import { getModule } from '@placeos/ts-client/realtime';

const my_mod = getModule('sys-death-star', 'TestModule', 3);
const my_variable = my_mod.binding('power');
const unbind = my_variable.bind();
const sub = my_variable.listen(value => doSomething(value));
```

This binds to the `power` status variable on the 3rd `TestModule` in the system `sys-death-star`.
Any changes to the value of `power` on PlaceOS will then be emitted to the function passed to `listen`.

Other than listening to changes of values you can also remotely execute methods on modules.

```typescript
const my_mod = getModule('sys-death-star', 'DemoModule', 2);
my_mod.execute('power_off').then(
    (resp) => handleSuccess(resp)
    (err) => handleError(err)
);
```

This will execute the method `power_off` on the 2nd `DemoModule` in the system `sys-death-star`.
If the method doesn't exist or the system is turned off it will return an error.
The response from PlaceOS can be handled using the promise returned by the `execute` method.

### HTTP API

For the HTTP API, `PlaceOS` provides various methods for each of the root endpoints available on PlaceOS's RESTful API.

Docs for the API can be found here https://docs.placeos.com/api/control

Methods are provided for `brokers`, `drivers`, `metadata`, `modules`, `repositories`, `settings`, `systems`, `triggers`, `users`, and `zones`.

```typescript
// Drivers CRUD
addDriver(driver_data).subscribe(new_driver => doSomething(new_driver));
showDriver(driver_id).subscribe(driver => doSomething(driver));
updateDriver(driver_id, driver_data).subscribe(updated_driver => doSomething(updated_driver));
removeDriver(driver_id).subscribe(() => doSomething());

// Modules CRUD
addModule(module_data).subscribe(new_module => doSomething(new_module));
showModule(module_id).subscribe(mod => doSomething(mod));
updateModule(module_id, module_data).subscribe(updated_module => doSomething(updated_module));
removeModule(module_id).subscribe(() => doSomething());

// Systems CRUD
addSystem(system_data).subscribe(new_system => doSomething(new_system));
showSystem(system_id).subscribe(system => doSomething(system));
updateSystem(system_id, system_data).subscribe(updated_system => doSomething(updated_system));
removeSystem(system_id).subscribe(() => doSomething());

// Users CRUD
addUser(user_data).subscribe(new_user => doSomething(new_user));
showUser(user_id).subscribe(user => doSomething(user));
updateUser(user_id, user_data).subscribe(updated_user => doSomething(updated_user));
removeUser(user_id).subscribe(() => doSomething());

// Zones CRUD
addZone(zone_data).subscribe(new_zone => doSomething(new_zone));
showZone(zone_id).subscribe(zone => doSomething(zone));
updateZone(zone_id, zone_data).subscribe(updated_zone => doSomething(updated_zone));
removeZone(zone_id).subscribe(() => doSomething());
```

The modules also provide methods for the various item action endpoints

```typescript
// Driver Actions
reloadDriver(driver_id);

// Module Actions
startModule(module_id);
stopModule(module_id);
pingModule(module_id);
lookupModuleState(module_id, lookup);
moduleState(module_id);

// System Actions
addSystemModule(system_id, module_name);
removeSystemModule(system_id, module_name);
startSystem(system_id);
stopSystem(system_id);
executeOnSystem(system_id, module_name, index, args);
lookupSystemModuleState(system_id, module_name, index, lookup);
functionList(system_id, module_name, index);
moduleTypes(system_id, module_name);
moduleCount(system_id);
listSystemZones(system_id);

// User Actions
currentUser();
```

Objects returned by `show` and `query` methods are immutable.
Therefore to change items you'll need to create a new object to store the changes.

```typescript
showZone(zone_id).then(zone => {
    cosnole.log(zone.description); // Some Description
    const zone_edited = new PlaceZone({ ...zone, description: 'New description' });
    updateZone(zone_edited.id, zone_edited).then(updated_zone => {
        cosnole.log(updated_zone.description); // New description
    });
});
```

You can find more details about endpoint action on the API docs

https://app.swaggerhub.com/apis/ACAprojects/PlaceOS/3.5.0#/

## Writing mocks

If you don't have access to a PlaceOS server you can also write mocks so that you can still develop interfaces for PlaceOS.

To use the mock services you can pass `mock: true` into the initialisation object.

### Websockets

To write mocks for the the realtime(websocket) API you'll need to register your systems with the `registerSystem` before attempting to bind to the modules it contains.

```typescript
import { registerSystem } from '@placeos/ts-client/realtime';

registerSystem('my-system', {
    MyModule: [
        {
            power: true,
            $power_on: function() {
                this.power = true;
            },
            $power_off: function() {
                this.power = false;
            }
        }
    ]
});
```

Note that executable methods on mock systems are namespaced with `$` as real systems in PlaceOS allow for methods to have the same name as variables.

Once initialised interactions with a system are performed in the same manner as the live system.

```typescript
const my_mod = getModule('my-system', 'MyModule', 1);
const my_variable = my_mod.binding('power');
const unbind = my_variable.bind();
const sub = my_variable.listen(value => doSomething(value)); // Emits true
my_mod.execute('power_off'); // The listen callback will now emit false
```

Some methods may need access to other modules within the system, for this a property is appended on runtime called `_system` which allows for access to the parent system

```typescript
registerSystem('my-system', {
    "MyModule": [
        {
            $lights_off: function () { this._system.MyOtherModule[0].lights = false; }
        }
    ]
    "MyOtherModule": [
        {
            lights: true,
        }
    ]
});
```

### HTTP Requests

HTTP API Requests can be mocked in a similar way to the realtime API by registering handlers with `registerMockEndpoint`

```typescript
import { registerMockEndpoint } from '@placeos/ts-client/api';

registerMockEndpoint({
    path: '/api/engine/v2/systems',
    metadata: {},
    method: 'GET',
    callback: request => my_mock_systems
});
```

Paths allow for route parameters and will pass the value in the callback input.

```typescript
registerMockEndpoint({
    path: '/api/engine/v2/systems/:system_id',
    ...
    callback: (request) =>
        my_mock_systems.find(sys => sys.id === request.route_params.system_id)
});
```

Query parameters are also available on the callback input.

`GET`, `POST`, `PUT`, `PATCH` and `DELETE` requests can be mocked out.

If a request is made and there are no handlers it will attempt to make the live request.

### Authentication

Authentication is handled automatically by the library but can be configured with the `setup` configuration.

If you wish to handle login within your application you can set `handle_login` to `false` to prevent redirecting to the login URL set in the `authority`.  
If you wish to prevent redirecting the application to handle application authentication you can set `use_iframe` to `true` to have that handled in the background.

![Authentication Flowchart](https://aca.im/cdn/images/auth-flowchart.png)
