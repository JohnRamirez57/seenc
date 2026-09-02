import { store, type RootState } from "../store/store";

export class ToolkitManager {
    public getState = <K extends keyof RootState>(reducerOption: K): RootState[K] => {
        return store.getState()[reducerOption];
    }

    public updateState = <
        A extends (...args: any[]) => any
    >(
        action: A,
        ...payload: Parameters<A>
    ): void => {
        store.dispatch(action(...payload));
    };
}