import { Container } from "inversify";
import { Locator } from "./locator";
import "reflect-metadata";

import { IMeasuresRepository, MeasuresRepository } from "./src/repositories/measures-repository";
import { IMeasuresService, MeasuresService } from "./src/services/measures-service";
import { IGeminiService, GeminiService } from "./src/services/gemini-service";

export const container = new Container();

// facilitar: sempre que eu invocar essa interface -> a partir desse Locator -> vou passar essa classe
container.bind<IMeasuresRepository>(Locator.IMeasuresRepository).to(MeasuresRepository);
container.bind<IMeasuresService>(Locator.IMeasuresService).to(MeasuresService);
container.bind<IGeminiService>(Locator.IGeminiService).to(GeminiService);

container.bind<MeasuresService>(MeasuresService).toSelf()