# TypeScript SVG Viewer

This library is a Typescript for interacting with SVG files

## Compilation

You can build the library from source after installing the dependencies with the command

`npm run build`

## Usage

API docs can be found [here](https://mryuion.github.io/svg-viewer)

You can install the library with the npm command

`npm install --save-dev @yuion/svg-viewer`

Before using the SVG you'll need to add the global styles it will need to be initialised.

```Typescript
import { applyGlobalStyles } from '@yuion/svg-viewer';

applyGlobalStyles();
```

To create a new viewer use the create method. A DOM element and URL are required to create. Available options are the fields defined in the [Viewer](./src/viewer.class.ts) class.

```Typescript
import { createViewer } from '@yuion/svg-viewer';

const element = document.querySelector('#my-svg-container');
const url = `https://my.domain/path/to/file.svg`;

const view_id = createViewer({
    element,
    url
});
```

To update the state of the viewer you can use the update method. Available options are the fields defined in the [Viewer](./src/viewer.class.ts) class.

```Typescript
import { updateViewer } from '@yuion/svg-viewer';

const view_id = 'id-of-my-viewer';
const zoom = 2; // 200% zoom
const center = { x: .75, y: .25 }; // 200% zoom

updateViewer(view_id, {
    zoom,
    center
});
```

When you are finished with the viewer you can cleanup using the remove method.


```Typescript
import { removeViewer } from '@yuion/svg-viewer';

const view_id = 'id-of-my-viewer';

removeViewer(view_id);
```

You can change the styles of the SVG by passing them to the update method.

```Typescript
import { updateViewer } from '@yuion/svg-viewer';

const view_id = 'id-of-my-viewer';
const style = {
    'my-css-seletor': {
        'background-color': 'white'
    }
};

updateViewer(view_id, { styles });
```

You can also listen to user events on the SVG by passing them to the update method.

```Typescript
import { updateViewer } from '@yuion/svg-viewer';

const view_id = 'id-of-my-viewer';
const actions = [
    { id: 'my-element-id', action: 'click', callback: (e) => doSomething() }
];

updateViewer(view_id, { actions });
```

You can also focus on points and elements in the SVG by passing them to the update method.

```Typescript
import { updateViewer } from '@yuion/svg-viewer';

const view_id = 'id-of-my-viewer';
let focus = { 
    location: { x: .6, y: .2 } 
};

updateViewer(view_id, { focus });

focus = { 
    location: 'my-element-id',
    zoom_level: 1.5
};

updateViewer(view_id, { focus });
```

Finally, you can also render HTML element over the SVG by passing them to the update method.


```Typescript
import { updateViewer } from '@yuion/svg-viewer';

const view_id = 'id-of-my-viewer';
const element = document.querySelector('#my-element-id');
const features = [
    { location: 'svg-element-id', content: element }
];

updateViewer(view_id, { features });
```
