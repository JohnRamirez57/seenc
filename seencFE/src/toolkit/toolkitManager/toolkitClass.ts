import { useDispatch, useSelector } from "react-redux";
import type { RootState, SliceActions } from "../store/store";

export class ToolkitManager {
    private update: ReturnType<typeof useDispatch>;
    private get: typeof useSelector;

    constructor () {
        this.update = useDispatch();
        this.get = useSelector;
    }

    public getState = <K extends keyof RootState>(reducerOption: K): RootState[K] => {
        return this.get((state: RootState) => state[reducerOption]);
    }

    public updateState = <
    A extends (...args: any[]) => any
    >(
    action: A,
    ...payload: Parameters<A>
    ): void => {
    this.update(action(...payload));
    };


}