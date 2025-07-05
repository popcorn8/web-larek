import { EventEmitter } from './components/base/events';
import './scss/styles.scss';


// TODO: раскидать все по своим файлам

interface IBasketModel {
    items: Map<string, number>;
    add(id: string): void;
    remove(id: string): void;
}

interface IEventEmitter {
    emit: (event: string, data: unknown) => void;
}

class BasketModel implements IBasketModel {
    items: Map<string, number> = new Map();

    constructor(protected events: IEventEmitter) {}

    add(id: string): void {
        if (!this.items.has(id)) this.items.set(id, 0);
        this.items.set(id, this.items.get(id)! + 1);
        
    }

    remove(id: string): void {
        if (!this.items.has(id)) return;
        if (this.items.get(id)! > 0) {
            this.items.set(id, this.items.get(id)! - 1);
            if (this.items.get(id) === 0) this.items.delete(id);
        }
    }

    protected _changed() {
        this.events.emit('basket:change', { items: Array.from(this.items.keys()) });
    }
}

// const events = new EventEmitter();

// const basket = new BasketModel(events);

// events.on('basket:change', (data: { items: string[] }) => {
//     // вывод
// });

interface IProduct {
    id: string;
    title: string;
}

interface ICatalogModel {
    items: IProduct[];
    setItems(items: IProduct[]): void;
    getProduct(id: string): IProduct;
}

interface IViewConstructor {
    new (container: HTMLElement, events?: IEventEmitter): IView;
}

interface IView {
    render(data?: object): HTMLElement;
}

class BasketItemView implements IView {
    protected title: HTMLSpanElement;
    protected addButton: HTMLButtonElement;
    protected removeButton: HTMLButtonElement;

    protected id: string | null = null;

    constructor(protected container: HTMLElement, protected events: IEventEmitter) {
        this.title = container.querySelector('.basket-item__title') as HTMLSpanElement;
        this.addButton = container.querySelector('.basket-item__add') as HTMLButtonElement;
        this.removeButton = container.querySelector('.basket-item__remove') as HTMLButtonElement;

        this.addButton.addEventListener('click', () => {
            this.events.emit('ui:basket-add', { id: this.id })
        });

        this.removeButton.addEventListener('click', () => {
            this.events.emit('ui:basket-remove', { id: this.id })
        });
    }

    render(data: { id: string, title: string }) {
        if (data) {
            this.id = data.id;
            this.title.textContent = data.title;
        }
        return this.container;
    }
}

class BasketView implements IView {
    constructor(protected container: HTMLElement) {}
    render(data: { items: HTMLElement[] }) {
        if (data) {
            this.container.replaceChildren(...data.items);
        }
        return this.container;
    }
}


// инициализация
const api = new ShopApi();
const events = new EventEmitter();
const basketView = new BasketView(document.querySelector('basket'));
const basketModel = new BasketModel(events);
const catalogModel = new CatalogModel(events);

function renderBasket(items: string) {
    basketView.render(
        items.map(id => {
            const itemView = new BasketItemsView(events);
            return itemView.render(catalogModel.getProduct(id));
        })
    );
}

events.on('basket:change', (event: { items: string[] }) => {
    renderBasket(event.items);
});

events.on('ui:basket-add', (event: { id: string }) => {
    basketModel.add(event.id);
});

events.on('ui:basket-remove', (event: { id: string }) => {
    basketModel.remove(event.id);
});

api.getCatalog()
    .then(catalogModel.setItems.bind(catalogModel))
    .catch(err => console.error(err));
