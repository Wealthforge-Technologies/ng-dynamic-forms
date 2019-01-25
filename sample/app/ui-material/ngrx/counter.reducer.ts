import { Action } from '@ngrx/store';
import { ActionTypes } from './counter.actions';

export interface User {
    firstName: string,
    lastName:  string,
    age:       number
}

export interface Counter {
    counterType:     string,
    counterValue:    number,
    primaryUser:     User,
    additionalUsers: User[]
}

export interface State {
    counter: Counter
}

export const initialState: State = {
    counter: {
        counterType: "testCounter",
        counterValue: 0,
        primaryUser: {
            firstName: "Bob",
            lastName:  "Bilas"
        }
    } as Counter
}

export function counterReducer(state = initialState, action: Action) {
  switch (action.type) {
    case ActionTypes.Increment:
    //   return state + 1;
    return {
        ...state,
        counter: {
            ...state.counter,
            counterValue: state.counter.counterValue + 1
        }
    }

    case ActionTypes.Decrement:
    //   return state - 1;
    return {
        ...state,
        counter: {
            ...state.counter,
            counterValue: state.counter.counterValue - 1
        }
    }

    case ActionTypes.Reset:
    //   return 0;
      return {
        ...state,
        counter: {
            ...state.counter,
            counterValue: 0
        }
    }

    default:
      return state;
  }
}